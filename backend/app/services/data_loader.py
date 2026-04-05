"""
data_loader.py
──────────────
Single entry-point for obtaining a DataStore.

Priority order:
  1. PostgreSQL   — when DATABASE_URL env var is set (production / Railway)
  2. Excel file   — fallback for local development without a database

All analytics functions only call get_store() — they never know which
source the data came from.
"""
import pandas as pd
import numpy as np
from app.core.config import DATA_FILE, USE_DATABASE


class DataStore:
    """Holds all 14 DataFrames parsed from whichever source is active."""

    def __init__(self, path: str):
        """Load from Excel file (used as fallback / local dev)."""
        sheets = pd.read_excel(path, sheet_name=None)
        for df in sheets.values():
            df.columns = df.columns.str.lower().str.strip()

        self.patients     = sheets["Patients"].copy()
        self.medical      = sheets["MedicalRecord"].copy()
        self.appointments = sheets["Appointment"].copy()
        self.bed_rec      = sheets["BedRecords"].copy()
        self.room_rec     = sheets["RoomRecords"].copy()
        self.surgery      = sheets["SurgeryRecord"].copy()
        self.doctors      = sheets["Doctor"].copy()
        self.nurses       = sheets["Nurse"].copy()
        self.helpers      = sheets["Helpers"].copy()
        self.beds         = sheets["Bed"].copy()
        self.rooms        = sheets["Room"].copy()
        self.wards        = sheets["Ward"].copy()
        self.departments  = sheets["Department"].copy()
        self.shifts       = sheets["StaffShift"].copy()

        self._parse_dates()
        self._derived_columns()

    def _parse_dates(self):
        for col in ["admission_date", "discharge_date"]:
            self.bed_rec[col]  = pd.to_datetime(self.bed_rec[col],  errors="coerce")
            self.room_rec[col] = pd.to_datetime(self.room_rec[col], errors="coerce")

        self.appointments["appointment_date"] = pd.to_datetime(
            self.appointments["appointment_date"], errors="coerce")
        self.medical["visit_date"] = pd.to_datetime(self.medical["visit_date"],  errors="coerce")
        self.medical["next_visit"] = pd.to_datetime(self.medical["next_visit"],  errors="coerce")
        self.surgery["surgery_date"] = pd.to_datetime(self.surgery["surgery_date"], errors="coerce")
        self.shifts["shift_date"]  = pd.to_datetime(self.shifts["shift_date"],  errors="coerce")
        self.patients["date_of_birth"] = pd.to_datetime(self.patients["date_of_birth"], errors="coerce")

    def _derived_columns(self):
        self.bed_rec["los"] = (
            self.bed_rec["discharge_date"] - self.bed_rec["admission_date"]
        ).dt.days.clip(lower=1)
        self.room_rec["los"] = (
            self.room_rec["discharge_date"] - self.room_rec["admission_date"]
        ).dt.days.clip(lower=1)

        self.bed_rec["revenue_per_day"]  = self.bed_rec["amount"]  / self.bed_rec["los"]
        self.room_rec["revenue_per_day"] = self.room_rec["amount"] / self.room_rec["los"]

        bed_adm  = self.bed_rec[["patient_id","admission_date","discharge_date"]].assign(source="Bed")
        room_adm = self.room_rec[["patient_id","admission_date","discharge_date"]].assign(source="Room")
        self.all_admissions = pd.concat([bed_adm, room_adm], ignore_index=True).dropna(
            subset=["admission_date"]
        ).sort_values(["patient_id","admission_date"])


# ── Period filter ─────────────────────────────────────────────────────────────

def filter_store(ds: 'DataStore', year: int | None, month: int | None) -> 'DataStore':
    """
    Return a DataStore-like object with time-series tables filtered to the
    requested year / month.  Reference tables (patients, staff, beds …) are
    never filtered.  Returns ds unchanged when no filter is requested.
    """
    if year is None and month is None:
        return ds

    def _filt(df: pd.DataFrame, col: str) -> pd.DataFrame:
        if col not in df.columns:
            return df
        mask = pd.Series(True, index=df.index)
        if year is not None:
            mask &= df[col].dt.year == year
        if month is not None:
            mask &= df[col].dt.month == month
        return df[mask].copy()

    fs = object.__new__(DataStore)   # skip __init__; assign attrs manually

    # Reference tables — unfiltered
    fs.patients    = ds.patients
    fs.doctors     = ds.doctors
    fs.nurses      = ds.nurses
    fs.helpers     = ds.helpers
    fs.beds        = ds.beds
    fs.rooms       = ds.rooms
    fs.wards       = ds.wards
    fs.departments = ds.departments

    # Time-series tables — filtered
    fs.appointments = _filt(ds.appointments, 'appointment_date')
    fs.medical      = _filt(ds.medical,      'visit_date')
    fs.surgery      = _filt(ds.surgery,      'surgery_date')
    fs.shifts       = _filt(ds.shifts,       'shift_date')
    fs.bed_rec      = _filt(ds.bed_rec,      'admission_date')
    fs.room_rec     = _filt(ds.room_rec,     'admission_date')

    # Recompute all_admissions from the filtered records
    bed_adm  = fs.bed_rec[['patient_id', 'admission_date', 'discharge_date']].assign(source='Bed')
    room_adm = fs.room_rec[['patient_id', 'admission_date', 'discharge_date']].assign(source='Room')
    fs.all_admissions = pd.concat(
        [bed_adm, room_adm], ignore_index=True
    ).dropna(subset=['admission_date']).sort_values(['patient_id', 'admission_date'])

    return fs


# ── Global singleton ──────────────────────────────────────────────────────────
_store: DataStore | None = None


def get_store() -> DataStore:
    """Return the cached DataStore (PostgreSQL or Excel depending on config)."""
    global _store
    if _store is None:
        if USE_DATABASE:
            from app.db.db_loader import load_store_from_db
            print("🗄️  Loading data from PostgreSQL…")
            _store = load_store_from_db()
            print(f"✅ DB loaded — {len(_store.patients):,} patients, "
                  f"{len(_store.appointments):,} appointments")
        else:
            print("📊 Loading data from Excel file…")
            _store = DataStore(DATA_FILE)
            print("✅ Excel loaded successfully")
    return _store


def reset_store():
    """Force a full reload on the next get_store() call (used after seeding)."""
    global _store
    _store = None
