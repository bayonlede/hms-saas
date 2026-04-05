"""
db/models.py
────────────
SQLAlchemy ORM models that mirror the 14-table SQL Server schema
(converted to PostgreSQL-compatible types).

Column names are lowercased to match what the analytics layer expects.
The ORM uses the exact same column names as the original SQL file so
that the analytics functions that read DataFrames can operate unchanged.
"""
from sqlalchemy import (
    Column, Integer, String, Date, Time, Numeric,
    ForeignKey, BigInteger
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# ── 1. Department ─────────────────────────────────────────────────────────────
class Department(Base):
    __tablename__ = "department"
    dept_id   = Column(Integer, primary_key=True)
    dept_name = Column(String(100))


# ── 2. Room ───────────────────────────────────────────────────────────────────
class Room(Base):
    __tablename__ = "room"
    room_no   = Column(Integer, primary_key=True)
    dept_id   = Column(Integer, ForeignKey("department.dept_id"))
    room_type = Column(String(100))


# ── 3. Doctor ─────────────────────────────────────────────────────────────────
class Doctor(Base):
    __tablename__ = "doctor"
    doct_id      = Column(Integer, primary_key=True)
    dept_id      = Column(Integer, ForeignKey("department.dept_id"))
    fname        = Column(String(100))
    lname        = Column(String(100))
    gender       = Column(String(1))
    contact_no   = Column(String(100))
    surgeon_type = Column(String(100))
    office_no    = Column(Integer, ForeignKey("room.room_no"))


# ── 4. Nurse ──────────────────────────────────────────────────────────────────
class Nurse(Base):
    __tablename__ = "nurse"
    nurse_id   = Column(Integer, primary_key=True)
    dept_id    = Column(Integer, ForeignKey("department.dept_id"))
    fname      = Column(String(100))
    lname      = Column(String(100))
    gender     = Column(String(1))
    conatct_no = Column(String(100))   # kept typo from original schema


# ── 5. Helpers ────────────────────────────────────────────────────────────────
class Helpers(Base):
    __tablename__ = "helpers"
    helper_id  = Column(Integer, primary_key=True)
    dept_id    = Column(Integer, ForeignKey("department.dept_id"))
    fname      = Column(String(100))
    lname      = Column(String(100))
    gender     = Column(String(1))
    contact_no = Column(String(100))


# ── 6. Ward ───────────────────────────────────────────────────────────────────
class Ward(Base):
    __tablename__ = "ward"
    ward_no   = Column(Integer, primary_key=True)
    ward_name = Column(String(100))
    dept_id   = Column(Integer, ForeignKey("department.dept_id"))


# ── 7. Bed ────────────────────────────────────────────────────────────────────
class Bed(Base):
    __tablename__ = "bed"
    bed_no  = Column(Integer, primary_key=True)
    ward_no = Column(Integer, ForeignKey("ward.ward_no"))


# ── 8. Patients ───────────────────────────────────────────────────────────────
class Patients(Base):
    __tablename__ = "patients"
    patient_id    = Column(Integer, primary_key=True)
    fname         = Column(String(100))
    lname         = Column(String(100))
    gender        = Column(String(1))
    date_of_birth = Column(Date)
    contact_no    = Column(String(100))
    pt_address    = Column(String(100))


# ── 9. BedRecords ─────────────────────────────────────────────────────────────
class BedRecords(Base):
    __tablename__ = "bedrecords"
    admission_id    = Column(Integer, primary_key=True)
    bed_no          = Column(Integer, ForeignKey("bed.bed_no"))
    patient_id      = Column(Integer, ForeignKey("patients.patient_id"))
    nurse_id        = Column(Integer, ForeignKey("nurse.nurse_id"))
    helper_id       = Column(Integer, ForeignKey("helpers.helper_id"))
    admission_date  = Column(Date)
    discharge_date  = Column(Date)
    amount          = Column(Integer)
    mode_of_payment = Column(String(50))


# ── 10. RoomRecords ───────────────────────────────────────────────────────────
class RoomRecords(Base):
    __tablename__ = "roomrecords"
    admisson_id     = Column(Integer, primary_key=True)   # typo from original
    room_no         = Column(Integer, ForeignKey("room.room_no"))
    patient_id      = Column(Integer, ForeignKey("patients.patient_id"))
    nurse_id        = Column(Integer, ForeignKey("nurse.nurse_id"))
    helper_id       = Column(Integer, ForeignKey("helpers.helper_id"))
    admission_date  = Column(Date)
    discharge_date  = Column(Date)
    amount          = Column(Integer)
    mode_of_payment = Column(String(50))


# ── 11. Appointment ───────────────────────────────────────────────────────────
class Appointment(Base):
    __tablename__ = "appointment"
    appointment_id     = Column(Integer, primary_key=True)
    patient_id         = Column(Integer, ForeignKey("patients.patient_id"))
    doct_id            = Column(Integer, ForeignKey("doctor.doct_id"))
    reason             = Column(String(100))
    appointment_date   = Column(Date)
    payment_amount     = Column(Integer)
    mode_of_payment    = Column(String(100))
    mode_of_appointment= Column(String(100))
    appointment_status = Column(String(100))


# ── 12. MedicalRecord ─────────────────────────────────────────────────────────
class MedicalRecord(Base):
    __tablename__ = "medicalrecord"
    record_id           = Column(Integer, primary_key=True)
    doct_id             = Column(Integer, ForeignKey("doctor.doct_id"))
    patient_id          = Column(Integer, ForeignKey("patients.patient_id"))
    visit_date          = Column(Date)
    curr_weight         = Column(Numeric(10, 2))
    curr_height         = Column(Numeric(10, 2))
    curr_blood_pressure = Column(String(100))
    curr_temp_f         = Column(Numeric(10, 2))
    diagnosis           = Column(String(500))
    treatment           = Column(String(100))
    next_visit          = Column(Date)


# ── 13. StaffShift ────────────────────────────────────────────────────────────
class StaffShift(Base):
    __tablename__ = "staffshift"
    shift_id    = Column(Integer, primary_key=True)
    doct_id     = Column(Integer, ForeignKey("doctor.doct_id"))
    nurse_id    = Column(Integer, ForeignKey("nurse.nurse_id"))
    helper_id   = Column(Integer, ForeignKey("helpers.helper_id"))
    shift_date  = Column(Date)
    shift_start = Column(Time)
    shift_end   = Column(Time)


# ── 14. SurgeryRecord ─────────────────────────────────────────────────────────
class SurgeryRecord(Base):
    __tablename__ = "surgeryrecord"
    surgery_id   = Column(Integer, primary_key=True)
    patient_id   = Column(Integer, ForeignKey("patients.patient_id"))
    surgeon_id   = Column(Integer, ForeignKey("doctor.doct_id"))
    surgery_type = Column(String(100))
    surgery_date = Column(Date)
    start_time   = Column(Time)
    end_time     = Column(Time)
    room_no      = Column(Integer, ForeignKey("room.room_no"))
    notes        = Column(String(1000))
    nurse_id     = Column(Integer, ForeignKey("nurse.nurse_id"))
    helper_id    = Column(Integer, ForeignKey("helpers.helper_id"))
