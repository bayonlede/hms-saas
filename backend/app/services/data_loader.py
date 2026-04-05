"""
data_loader.py
──────────────
Loads the Excel file once at startup, standardises columns, parses dates,
and exposes typed DataFrames for every analysis route.
"""
import pandas as pd
import numpy as np
from functools import lru_cache
from app.core.config import DATA_FILE


class DataStore:
    """Singleton holding all parsed DataFrames."""

    def __init__(self, path: str):
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

    # ── Date parsing ──────────────────────────────────────────────────────────
    def _parse_dates(self):
        for col in ["admission_date", "discharge_date"]:
            self.bed_rec[col]  = pd.to_datetime(self.bed_rec[col],  errors="coerce")
            self.room_rec[col] = pd.to_datetime(self.room_rec[col], errors="coerce")

        self.appointments["appointment_date"] = pd.to_datetime(
            self.appointments["appointment_date"], errors="coerce"
        )
        self.medical["visit_date"] = pd.to_datetime(self.medical["visit_date"], errors="coerce")
        self.medical["next_visit"] = pd.to_datetime(self.medical["next_visit"], errors="coerce")
        self.surgery["surgery_date"] = pd.to_datetime(self.surgery["surgery_date"], errors="coerce")
        self.shifts["shift_date"] = pd.to_datetime(self.shifts["shift_date"], errors="coerce")
        self.patients["date_of_birth"] = pd.to_datetime(self.patients["date_of_birth"], errors="coerce")

    # ── Derived columns ───────────────────────────────────────────────────────
    def _derived_columns(self):
        self.bed_rec["los"] = (
            self.bed_rec["discharge_date"] - self.bed_rec["admission_date"]
        ).dt.days.clip(lower=1)
        self.room_rec["los"] = (
            self.room_rec["discharge_date"] - self.room_rec["admission_date"]
        ).dt.days.clip(lower=1)

        self.bed_rec["revenue_per_day"]  = self.bed_rec["amount"]  / self.bed_rec["los"]
        self.room_rec["revenue_per_day"] = self.room_rec["amount"] / self.room_rec["los"]

        # Combined admissions
        bed_adm  = self.bed_rec[["patient_id","admission_date","discharge_date"]].assign(source="Bed")
        room_adm = self.room_rec[["patient_id","admission_date","discharge_date"]].assign(source="Room")
        self.all_admissions = pd.concat([bed_adm, room_adm], ignore_index=True).dropna(
            subset=["admission_date"]
        ).sort_values(["patient_id","admission_date"])


_store: DataStore | None = None


def get_store() -> DataStore:
    global _store
    if _store is None:
        _store = DataStore(DATA_FILE)
    return _store
