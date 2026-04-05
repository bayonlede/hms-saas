#!/usr/bin/env python3
"""
seed_db.py
──────────
Reads Hospital_Management_System.sql (T-SQL / SQL Server syntax),
converts it to PostgreSQL-compatible SQL, creates all 14 tables,
and inserts every row.

Usage:
    python seed_db.py                         # uses DATABASE_URL env var
    python seed_db.py --url postgresql://...  # override connection URL

Run this ONCE after provisioning the Railway PostgreSQL service.
Re-running is safe — it drops and recreates all tables.
"""
import os
import re
import sys
import argparse
import psycopg2
from psycopg2.extras import execute_batch


# ── DDL for all 14 tables in PostgreSQL syntax ────────────────────────────────
# Converted from the original T-SQL schema.
# We use SERIAL / INTEGER rather than T-SQL INT PRIMARY KEY IDENTITY.

SCHEMA_SQL = """
DROP TABLE IF EXISTS surgeryrecord  CASCADE;
DROP TABLE IF EXISTS staffshift     CASCADE;
DROP TABLE IF EXISTS medicalrecord  CASCADE;
DROP TABLE IF EXISTS appointment    CASCADE;
DROP TABLE IF EXISTS roomrecords    CASCADE;
DROP TABLE IF EXISTS bedrecords     CASCADE;
DROP TABLE IF EXISTS bed            CASCADE;
DROP TABLE IF EXISTS ward           CASCADE;
DROP TABLE IF EXISTS helpers        CASCADE;
DROP TABLE IF EXISTS nurse          CASCADE;
DROP TABLE IF EXISTS patients       CASCADE;
DROP TABLE IF EXISTS doctor         CASCADE;
DROP TABLE IF EXISTS room           CASCADE;
DROP TABLE IF EXISTS department     CASCADE;

CREATE TABLE department (
    dept_id   INTEGER PRIMARY KEY,
    dept_name VARCHAR(100)
);

CREATE TABLE room (
    room_no   INTEGER PRIMARY KEY,
    dept_id   INTEGER REFERENCES department(dept_id),
    room_type VARCHAR(100)
);

CREATE TABLE doctor (
    doct_id      INTEGER PRIMARY KEY,
    dept_id      INTEGER REFERENCES department(dept_id),
    fname        VARCHAR(100),
    lname        VARCHAR(100),
    gender       CHAR(1),
    contact_no   VARCHAR(100),
    surgeon_type VARCHAR(100),
    office_no    INTEGER REFERENCES room(room_no)
);

CREATE TABLE nurse (
    nurse_id   INTEGER PRIMARY KEY,
    dept_id    INTEGER REFERENCES department(dept_id),
    fname      VARCHAR(100),
    lname      VARCHAR(100),
    gender     CHAR(1),
    conatct_no VARCHAR(100)
);

CREATE TABLE helpers (
    helper_id  INTEGER PRIMARY KEY,
    dept_id    INTEGER REFERENCES department(dept_id),
    fname      VARCHAR(100),
    lname      VARCHAR(100),
    gender     CHAR(1),
    contact_no VARCHAR(100)
);

CREATE TABLE ward (
    ward_no   INTEGER PRIMARY KEY,
    ward_name VARCHAR(100),
    dept_id   INTEGER REFERENCES department(dept_id)
);

CREATE TABLE bed (
    bed_no  INTEGER PRIMARY KEY,
    ward_no INTEGER REFERENCES ward(ward_no)
);

CREATE TABLE patients (
    patient_id    INTEGER PRIMARY KEY,
    fname         VARCHAR(100),
    lname         VARCHAR(100),
    gender        CHAR(1),
    date_of_birth DATE,
    contact_no    VARCHAR(100),
    pt_address    VARCHAR(200)
);

CREATE TABLE bedrecords (
    admission_id    INTEGER PRIMARY KEY,
    bed_no          INTEGER REFERENCES bed(bed_no),
    patient_id      INTEGER REFERENCES patients(patient_id),
    nurse_id        INTEGER REFERENCES nurse(nurse_id),
    helper_id       INTEGER REFERENCES helpers(helper_id),
    admission_date  DATE,
    discharge_date  DATE,
    amount          INTEGER,
    mode_of_payment VARCHAR(50)
);

CREATE TABLE roomrecords (
    admisson_id     INTEGER PRIMARY KEY,
    room_no         INTEGER REFERENCES room(room_no),
    patient_id      INTEGER REFERENCES patients(patient_id),
    nurse_id        INTEGER REFERENCES nurse(nurse_id),
    helper_id       INTEGER REFERENCES helpers(helper_id),
    admission_date  DATE,
    discharge_date  DATE,
    amount          INTEGER,
    mode_of_payment VARCHAR(50)
);

CREATE TABLE appointment (
    appointment_id      INTEGER PRIMARY KEY,
    patient_id          INTEGER REFERENCES patients(patient_id),
    doct_id             INTEGER REFERENCES doctor(doct_id),
    reason              VARCHAR(100),
    appointment_date    DATE,
    payment_amount      INTEGER,
    mode_of_payment     VARCHAR(100),
    mode_of_appointment VARCHAR(100),
    appointment_status  VARCHAR(100)
);

CREATE TABLE medicalrecord (
    record_id           INTEGER PRIMARY KEY,
    doct_id             INTEGER REFERENCES doctor(doct_id),
    patient_id          INTEGER REFERENCES patients(patient_id),
    visit_date          DATE,
    curr_weight         NUMERIC(10,2),
    curr_height         NUMERIC(10,2),
    curr_blood_pressure VARCHAR(100),
    curr_temp_f         NUMERIC(10,2),
    diagnosis           VARCHAR(500),
    treatment           VARCHAR(100),
    next_visit          DATE
);

CREATE TABLE staffshift (
    shift_id    INTEGER PRIMARY KEY,
    doct_id     INTEGER REFERENCES doctor(doct_id),
    nurse_id    INTEGER REFERENCES nurse(nurse_id),
    helper_id   INTEGER REFERENCES helpers(helper_id),
    shift_date  DATE,
    shift_start TIME,
    shift_end   TIME
);

CREATE TABLE surgeryrecord (
    surgery_id   INTEGER PRIMARY KEY,
    patient_id   INTEGER REFERENCES patients(patient_id),
    surgeon_id   INTEGER REFERENCES doctor(doct_id),
    surgery_type VARCHAR(100),
    surgery_date DATE,
    start_time   TIME,
    end_time     TIME,
    room_no      INTEGER REFERENCES room(room_no),
    notes        VARCHAR(1000),
    nurse_id     INTEGER REFERENCES nurse(nurse_id),
    helper_id    INTEGER REFERENCES helpers(helper_id)
);

CREATE INDEX IF NOT EXISTS idx_bedrecords_patient    ON bedrecords(patient_id);
CREATE INDEX IF NOT EXISTS idx_bedrecords_admission  ON bedrecords(admission_date);
CREATE INDEX IF NOT EXISTS idx_roomrecords_patient   ON roomrecords(patient_id);
CREATE INDEX IF NOT EXISTS idx_roomrecords_admission ON roomrecords(admission_date);
CREATE INDEX IF NOT EXISTS idx_appointment_patient   ON appointment(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_date      ON appointment(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointment_status    ON appointment(appointment_status);
CREATE INDEX IF NOT EXISTS idx_medicalrecord_patient ON medicalrecord(patient_id);
CREATE INDEX IF NOT EXISTS idx_medicalrecord_visit   ON medicalrecord(visit_date);
CREATE INDEX IF NOT EXISTS idx_surgeryrecord_patient ON surgeryrecord(patient_id);
CREATE INDEX IF NOT EXISTS idx_surgeryrecord_date    ON surgeryrecord(surgery_date);
"""


def clean_sql(raw: str) -> str:
    """Convert T-SQL INSERT blocks to standard SQL."""
    # Remove Windows line endings
    sql = raw.replace("\r\n", "\n").replace("\r", "\n")

    # Remove T-SQL block comments /* ... */
    sql = re.sub(r"/\*.*?\*/", "", sql, flags=re.DOTALL)

    # Remove T-SQL line comments
    sql = re.sub(r"--[^\n]*", "", sql)

    # Remove GO statements
    sql = re.sub(r"^\s*GO\s*$", "", sql, flags=re.MULTILINE)

    # Remove USE / CREATE DATABASE / Drop Database lines
    sql = re.sub(r"(?i)^\s*(Use|Create\s+Database|Drop\s+Database)[^\n]*\n", "", sql, flags=re.MULTILINE)

    return sql


def extract_inserts(sql: str) -> dict[str, list[str]]:
    """
    Extract INSERT INTO <table> VALUES (...), (...); blocks.
    Returns {table_name_lower: [value_tuple_str, ...]}
    """
    # Normalise "Insert Into" → "INSERT INTO"
    sql = re.sub(r"(?i)\bInsert\s+Into\b", "INSERT INTO", sql)

    # Match INSERT INTO <name> Values/VALUES block
    pattern = re.compile(
        r"INSERT\s+INTO\s+(\w+)\s*\n\s*Values?\s*\n(.*?)(?=INSERT\s+INTO|\Z)",
        re.IGNORECASE | re.DOTALL,
    )

    result: dict[str, list[str]] = {}
    for m in pattern.finditer(sql):
        table = m.group(1).lower()
        body  = m.group(2).strip()

        # Split on ),\n( — each row is a value tuple
        # Remove trailing semicolon
        body = body.rstrip("; \n")

        # Extract individual tuples: find (...) patterns at the row level
        rows = re.findall(r"\(([^()]*(?:\([^()]*\)[^()]*)*)\)", body)
        if table not in result:
            result[table] = []
        result[table].extend(rows)

    return result


def parse_row(row_str: str) -> tuple:
    """
    Parse a comma-separated value string into a Python tuple,
    handling quoted strings with embedded commas.
    """
    values = []
    current = ""
    in_quote = False
    quote_char = None

    for ch in row_str:
        if in_quote:
            current += ch
            if ch == quote_char:
                in_quote = False
        elif ch in ("'", '"'):
            in_quote = True
            quote_char = ch
            current += ch
        elif ch == ",":
            values.append(current.strip())
            current = ""
        else:
            current += ch

    if current.strip():
        values.append(current.strip())

    result = []
    for v in values:
        v = v.strip()
        if v.upper() == "NULL":
            result.append(None)
        elif v.startswith("'") and v.endswith("'"):
            result.append(v[1:-1].replace("''", "'"))
        else:
            # Try numeric conversion
            try:
                if "." in v:
                    result.append(float(v))
                else:
                    result.append(int(v))
            except ValueError:
                result.append(v)

    return tuple(result)


# Table insert order respects foreign key constraints
TABLE_ORDER = [
    "department", "room", "doctor", "nurse", "helpers",
    "ward", "bed", "patients",
    "bedrecords", "roomrecords", "appointment",
    "medicalrecord", "staffshift", "surgeryrecord",
]

# Column lists matching the PostgreSQL schema
TABLE_COLUMNS = {
    "department":   ["dept_id", "dept_name"],
    "room":         ["room_no", "dept_id", "room_type"],
    "doctor":       ["doct_id", "dept_id", "fname", "lname", "gender",
                     "contact_no", "surgeon_type", "office_no"],
    "nurse":        ["nurse_id", "dept_id", "fname", "lname", "gender", "conatct_no"],
    "helpers":      ["helper_id", "dept_id", "fname", "lname", "gender", "contact_no"],
    "ward":         ["ward_no", "ward_name", "dept_id"],
    "bed":          ["bed_no", "ward_no"],
    "patients":     ["patient_id", "fname", "lname", "gender",
                     "date_of_birth", "contact_no", "pt_address"],
    "bedrecords":   ["admission_id", "bed_no", "patient_id", "nurse_id",
                     "helper_id", "admission_date", "discharge_date",
                     "amount", "mode_of_payment"],
    "roomrecords":  ["admisson_id", "room_no", "patient_id", "nurse_id",
                     "helper_id", "admission_date", "discharge_date",
                     "amount", "mode_of_payment"],
    "appointment":  ["appointment_id", "patient_id", "doct_id", "reason",
                     "appointment_date", "payment_amount", "mode_of_payment",
                     "mode_of_appointment", "appointment_status"],
    "medicalrecord":["record_id", "doct_id", "patient_id", "visit_date",
                     "curr_weight", "curr_height", "curr_blood_pressure",
                     "curr_temp_f", "diagnosis", "treatment", "next_visit"],
    "staffshift":   ["shift_id", "doct_id", "nurse_id", "helper_id",
                     "shift_date", "shift_start", "shift_end"],
    "surgeryrecord":["surgery_id", "patient_id", "surgeon_id", "surgery_type",
                     "surgery_date", "start_time", "end_time", "room_no",
                     "notes", "nurse_id", "helper_id"],
}


def seed(db_url: str, sql_file: str):
    print(f"📂 Reading SQL file: {sql_file}")
    with open(sql_file, "r", encoding="utf-8-sig") as f:
        raw = f.read()

    cleaned  = clean_sql(raw)
    inserts  = extract_inserts(cleaned)

    print(f"🔌 Connecting to database…")
    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    cur  = conn.cursor()

    print("🏗️  Creating schema…")
    cur.execute(SCHEMA_SQL)
    conn.commit()

    for table in TABLE_ORDER:
        rows_raw = inserts.get(table, [])
        if not rows_raw:
            print(f"   ⚠️  No data found for: {table}")
            continue

        cols = TABLE_COLUMNS[table]
        placeholders = ", ".join(["%s"] * len(cols))
        col_list     = ", ".join(cols)
        sql_ins      = f"INSERT INTO {table} ({col_list}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"

        parsed_rows = []
        for r in rows_raw:
            try:
                row = parse_row(r)
                # Pad or truncate to match column count
                if len(row) < len(cols):
                    row = row + (None,) * (len(cols) - len(row))
                elif len(row) > len(cols):
                    row = row[:len(cols)]
                parsed_rows.append(row)
            except Exception as e:
                print(f"   ⚠️  Skipping malformed row in {table}: {e}")

        try:
            execute_batch(cur, sql_ins, parsed_rows, page_size=500)
            conn.commit()
            print(f"   ✅ {table:<20} {len(parsed_rows):>5} rows inserted")
        except Exception as e:
            conn.rollback()
            print(f"   ❌ {table}: {e}")

    cur.close()
    conn.close()
    print("\n🎉 Database seeding complete!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed HMS PostgreSQL database")
    parser.add_argument("--url",  default=os.getenv("DATABASE_URL", ""),
                        help="PostgreSQL connection URL")
    parser.add_argument("--file", default="Hospital_Management_System.sql",
                        help="Path to the SQL file")
    args = parser.parse_args()

    if not args.url:
        print("❌  No DATABASE_URL found. Set the env var or pass --url")
        sys.exit(1)

    # Convert asyncpg URL to psycopg2 URL if needed
    url = args.url
    if "asyncpg" in url:
        url = url.replace("+asyncpg", "")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    seed(url, args.file)
