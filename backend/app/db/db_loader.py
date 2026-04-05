"""
db/db_loader.py
───────────────
Loads all 14 tables from PostgreSQL into the same DataStore object
that the analytics layer already uses.  This means:

  • Every analytics function works unchanged.
  • The switch from Excel → DB is transparent to all API routes.
  • We use pandas.read_sql() with a sync psycopg2 connection so the
    DataStore builder stays simple and synchronous (it runs once at
    startup inside the FastAPI lifespan, not per-request).
"""
import pandas as pd
from sqlalchemy import create_engine, text

from app.core.config import DATABASE_URL
from app.services.data_loader import DataStore


def _sync_url(url: str) -> str:
    """Convert async URL scheme to sync psycopg2 scheme for pandas."""
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def load_store_from_db() -> DataStore:
    """
    Pull all 14 tables from PostgreSQL, build and return a DataStore.
    Called once at application startup.
    """
    url = _sync_url(DATABASE_URL)
    engine = create_engine(url, pool_pre_ping=True)

    with engine.connect() as conn:
        # ── Read all 14 tables ────────────────────────────────────────────────
        patients    = pd.read_sql("SELECT * FROM patients",     conn)
        medical     = pd.read_sql("SELECT * FROM medicalrecord", conn)
        appointments= pd.read_sql("SELECT * FROM appointment",   conn)
        bed_rec     = pd.read_sql("SELECT * FROM bedrecords",    conn)
        room_rec    = pd.read_sql("SELECT * FROM roomrecords",   conn)
        surgery     = pd.read_sql("SELECT * FROM surgeryrecord", conn)
        doctors     = pd.read_sql("SELECT * FROM doctor",        conn)
        nurses      = pd.read_sql("SELECT * FROM nurse",         conn)
        helpers     = pd.read_sql("SELECT * FROM helpers",       conn)
        beds        = pd.read_sql("SELECT * FROM bed",           conn)
        rooms       = pd.read_sql("SELECT * FROM room",          conn)
        wards       = pd.read_sql("SELECT * FROM ward",          conn)
        departments = pd.read_sql("SELECT * FROM department",    conn)
        shifts      = pd.read_sql("SELECT * FROM staffshift",    conn)

    # ── Rename primary-key columns to match what analytics expects ────────────
    # The SQL schema uses appointment_id for the PK; analytics references it
    # as appointment_id — no rename needed for most tables.
    # RoomRecords PK is admisson_id (typo in original schema) — keep as-is.

    # ── Rename surgery surgeon_id → surgeon_id (already correct) ─────────────
    # Appointment PK: appointment_id — the INSERT data uses appointment_id

    # ── Build a fake "sheets" dict and delegate to DataStore ─────────────────
    # DataStore.__init__ reads from pd.read_excel(); we bypass that by
    # constructing the object manually and calling _parse_dates + _derived_columns.

    class _DbStore(DataStore):
        """DataStore subclass that skips the Excel loading step."""
        def __init__(self):
            # Assign DataFrames directly — same attribute names as DataStore
            self.patients     = patients
            self.medical      = medical
            self.appointments = appointments
            self.bed_rec      = bed_rec
            self.room_rec     = room_rec
            self.surgery      = surgery
            self.doctors      = doctors
            self.nurses       = nurses
            self.helpers      = helpers
            self.beds         = beds
            self.rooms        = rooms
            self.wards        = wards
            self.departments  = departments
            self.shifts       = shifts

            # ── Normalise column names (PostgreSQL returns lowercase) ─────────
            for attr in vars(self).values():
                if isinstance(attr, pd.DataFrame):
                    attr.columns = attr.columns.str.lower().str.strip()

            # ── Rename RoomRecords PK to match analytics references ───────────
            # analytics.py uses 'room_no' on room_rec — already present
            # analytics.py uses 'admisson_id' not referenced directly — OK

            # ── Run shared date-parsing and derived columns ───────────────────
            self._parse_dates()
            self._derived_columns()

    return _DbStore()
