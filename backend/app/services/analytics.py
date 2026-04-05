"""
analytics.py
────────────
All analytical computations extracted from the Jupyter notebook,
refactored as pure functions that accept a DataStore and return
JSON-serialisable Python dicts / lists.
"""
import pandas as pd
import numpy as np
from datetime import datetime
from app.services.data_loader import DataStore


def _safe(v):
    """Convert numpy scalars to Python native types for JSON."""
    if isinstance(v, (np.integer,)):  return int(v)
    if isinstance(v, (np.floating,)): return None if np.isnan(v) else float(v)
    if isinstance(v, float) and np.isnan(v): return None
    if isinstance(v, pd.Timestamp):   return v.isoformat()
    return v


def _rows(df: pd.DataFrame) -> list[dict]:
    """Convert a DataFrame to a list of JSON-safe dicts."""
    return [{k: _safe(v) for k, v in row.items()} for row in df.to_dict("records")]


# ═══════════════════════════════════════════════════════════════════════════════
# OVERVIEW KPIs
# ═══════════════════════════════════════════════════════════════════════════════

def overview_kpis(ds: DataStore) -> dict:
    total_patients   = int(ds.patients["patient_id"].nunique())
    total_appts      = int(len(ds.appointments))
    completed_appts  = int((ds.appointments["appointment_status"] == "Completed").sum())
    noshow_appts     = int((ds.appointments["appointment_status"] == "No-Show").sum())
    cancelled_appts  = int((ds.appointments["appointment_status"] == "Cancelled").sum())

    total_rev_bed    = float(ds.bed_rec["amount"].sum())
    total_rev_room   = float(ds.room_rec["amount"].sum())
    total_rev_appt   = float(ds.appointments["payment_amount"].sum())
    total_revenue    = total_rev_bed + total_rev_room + total_rev_appt

    total_surgeries  = int(len(ds.surgery))
    total_doctors    = int(len(ds.doctors))
    total_nurses     = int(len(ds.nurses))
    total_helpers    = int(len(ds.helpers))
    total_staff      = total_doctors + total_nurses + total_helpers
    total_depts      = int(len(ds.departments))

    # Bed / Room capacity
    total_beds       = int(len(ds.beds))
    total_rooms      = int(len(ds.rooms))
    total_wards      = int(len(ds.wards))

    # Readmission
    adm = ds.all_admissions.sort_values(["patient_id","admission_date"])
    adm["prev_discharge"] = adm.groupby("patient_id")["discharge_date"].shift(1)
    adm["days_since_prev"] = (adm["admission_date"] - adm["prev_discharge"]).dt.days
    readmit = int((adm["days_since_prev"] <= 30).sum())
    unique_admitted = int(adm["patient_id"].nunique())

    # At-risk revenue
    today = pd.Timestamp.now()
    at_risk_df = ds.appointments[
        ds.appointments["appointment_status"].isin(["Scheduled","No-Show"]) &
        (ds.appointments["appointment_date"] < today)
    ]
    at_risk_rev = float(at_risk_df["payment_amount"].sum())

    return {
        "total_patients":      total_patients,
        "total_appointments":  total_appts,
        "completed_appointments": completed_appts,
        "noshow_appointments": noshow_appts,
        "cancelled_appointments": cancelled_appts,
        "completion_rate":     round(completed_appts / total_appts * 100, 1) if total_appts else 0,
        "noshow_rate":         round(noshow_appts    / total_appts * 100, 1) if total_appts else 0,
        "total_revenue":       round(total_revenue, 2),
        "revenue_beds":        round(total_rev_bed,  2),
        "revenue_rooms":       round(total_rev_room, 2),
        "revenue_appointments":round(total_rev_appt, 2),
        "total_surgeries":     total_surgeries,
        "total_staff":         total_staff,
        "total_doctors":       total_doctors,
        "total_nurses":        total_nurses,
        "total_helpers":       total_helpers,
        "total_departments":   total_depts,
        "total_beds":          total_beds,
        "total_rooms":         total_rooms,
        "total_wards":         total_wards,
        "readmission_count":   readmit,
        "readmission_rate":    round(readmit / unique_admitted * 100, 1) if unique_admitted else 0,
        "at_risk_revenue":     round(at_risk_rev, 2),
        "at_risk_count":       int(len(at_risk_df)),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# FINANCIAL
# ═══════════════════════════════════════════════════════════════════════════════

def revenue_by_department(ds: DataStore) -> list[dict]:
    appt_rev = (
        ds.appointments[["patient_id","doct_id","payment_amount"]]
        .rename(columns={"payment_amount":"revenue"})
        .merge(ds.doctors[["doct_id","dept_id"]], on="doct_id", how="left")
    )
    bed_rev = (
        ds.bed_rec[["patient_id","amount","bed_no"]]
        .rename(columns={"amount":"revenue"})
        .merge(ds.beds[["bed_no","ward_no"]], on="bed_no", how="left")
        .merge(ds.wards[["ward_no","dept_id"]], on="ward_no", how="left")
    )
    room_rev = (
        ds.room_rec[["patient_id","amount","room_no"]]
        .rename(columns={"amount":"revenue"})
        .merge(ds.rooms[["room_no","dept_id"]], on="room_no", how="left")
    )
    all_rev = pd.concat([appt_rev, bed_rev, room_rev], ignore_index=True)
    dept_rev = (
        all_rev.merge(ds.departments[["dept_id","dept_name"]], on="dept_id", how="left")
        .groupby("dept_name")
        .agg(total_revenue=("revenue","sum"), unique_patients=("patient_id","nunique"))
        .reset_index()
    )
    dept_rev["revenue_per_patient"] = (dept_rev["total_revenue"] / dept_rev["unique_patients"]).round(2)
    dept_rev = dept_rev.sort_values("total_revenue", ascending=False)
    return _rows(dept_rev)


def payment_mode_summary(ds: DataStore) -> list[dict]:
    appt_pay  = ds.appointments[["appointment_date","mode_of_payment","payment_amount"]].copy()
    appt_pay.columns = ["date","mode","amount"]
    bed_pay   = ds.bed_rec[["admission_date","mode_of_payment","amount"]].copy()
    bed_pay.columns = ["date","mode","amount"]
    room_pay  = ds.room_rec[["admission_date","mode_of_payment","amount"]].copy()
    room_pay.columns = ["date","mode","amount"]
    all_pay = pd.concat([appt_pay, bed_pay, room_pay], ignore_index=True).dropna(subset=["mode"])
    summary = (
        all_pay.groupby("mode")
        .agg(total_revenue=("amount","sum"), transactions=("amount","count"))
        .reset_index()
        .sort_values("total_revenue", ascending=False)
    )
    total = summary["total_revenue"].sum()
    summary["pct"] = (summary["total_revenue"] / total * 100).round(1)
    return _rows(summary)


def payment_mode_trend(ds: DataStore) -> list[dict]:
    appt_pay  = ds.appointments[["appointment_date","mode_of_payment","payment_amount"]].copy()
    appt_pay.columns = ["date","mode","amount"]
    bed_pay   = ds.bed_rec[["admission_date","mode_of_payment","amount"]].copy()
    bed_pay.columns = ["date","mode","amount"]
    room_pay  = ds.room_rec[["admission_date","mode_of_payment","amount"]].copy()
    room_pay.columns = ["date","mode","amount"]
    all_pay = pd.concat([appt_pay, bed_pay, room_pay], ignore_index=True).dropna()
    all_pay["month"] = all_pay["date"].dt.to_period("M").astype(str)
    trend = (
        all_pay.groupby(["month","mode"])["amount"]
        .sum().reset_index()
        .sort_values("month")
    )
    return _rows(trend)


def revenue_per_day_by_room_type(ds: DataStore) -> dict:
    avg_bed = float(ds.bed_rec["revenue_per_day"].mean())
    room_day = (
        ds.room_rec.merge(ds.rooms[["room_no","room_type"]], on="room_no", how="left")
    )
    by_type = (
        room_day.groupby("room_type")["revenue_per_day"]
        .agg(mean="mean", median="median", count="count")
        .reset_index()
    )
    return {"avg_bed_per_day": round(avg_bed, 2), "room_types": _rows(by_type)}


def at_risk_revenue(ds: DataStore) -> dict:
    today = pd.Timestamp.now()
    at_risk = ds.appointments[
        ds.appointments["appointment_status"].isin(["Scheduled","No-Show"]) &
        (ds.appointments["appointment_date"] < today)
    ].copy()
    at_risk["days_overdue"] = (today - at_risk["appointment_date"]).dt.days
    at_risk["risk_category"] = pd.cut(
        at_risk["days_overdue"],
        bins=[0, 30, 90, 180, 9999],
        labels=["0–30 days","31–90 days","91–180 days","180+ days"]
    )
    summary = (
        at_risk.groupby(["appointment_status","risk_category"])
        .agg(count=("appointment_id","count"), revenue=("payment_amount","sum"))
        .reset_index()
    )
    return {
        "total_at_risk":   round(float(at_risk["payment_amount"].sum()), 2),
        "noshow_revenue":  round(float(at_risk[at_risk["appointment_status"]=="No-Show"]["payment_amount"].sum()), 2),
        "scheduled_revenue": round(float(at_risk[at_risk["appointment_status"]=="Scheduled"]["payment_amount"].sum()), 2),
        "total_count":     int(len(at_risk)),
        "breakdown":       _rows(summary),
    }


def top_revenue_patients(ds: DataStore, n: int = 10) -> list[dict]:
    appt_total = ds.appointments.groupby("patient_id")["payment_amount"].sum().rename("appt_rev")
    bed_total  = ds.bed_rec.groupby("patient_id")["amount"].sum().rename("bed_rev")
    room_total = ds.room_rec.groupby("patient_id")["amount"].sum().rename("room_rev")
    result = (
        ds.patients[["patient_id","fname","lname","gender"]]
        .merge(appt_total, on="patient_id", how="left")
        .merge(bed_total,  on="patient_id", how="left")
        .merge(room_total, on="patient_id", how="left")
        .fillna(0)
    )
    result["total"] = result["appt_rev"] + result["bed_rev"] + result["room_rev"]
    result["name"]  = result["fname"] + " " + result["lname"]
    result = result.nlargest(n, "total")[["name","gender","appt_rev","bed_rev","room_rev","total"]]
    return _rows(result)


# ═══════════════════════════════════════════════════════════════════════════════
# OPERATIONAL
# ═══════════════════════════════════════════════════════════════════════════════

def occupancy_by_ward(ds: DataStore, start: str = "2024-11-01", end: str = "2025-05-31") -> list[dict]:
    s, e = pd.Timestamp(start), pd.Timestamp(end)
    total_days = (e - s).days + 1

    def overlaps(df):
        return df[(df["admission_date"] <= e) & (df["discharge_date"] >= s)].copy()

    bed_win  = overlaps(ds.bed_rec).merge(ds.beds[["bed_no","ward_no"]], on="bed_no", how="left")
    room_win = overlaps(ds.room_rec).merge(ds.rooms[["room_no","dept_id"]], on="room_no", how="left")

    ward_occ = (
        bed_win.merge(ds.wards[["ward_no","ward_name","dept_id"]], on="ward_no", how="left")
        .merge(ds.departments[["dept_id","dept_name"]], on="dept_id", how="left")
        .groupby("ward_name")
        .agg(occupied_bed_days=("bed_no","count"), total_beds=("bed_no","nunique"))
        .reset_index()
    )
    ward_occ["occupancy_pct"] = (
        ward_occ["occupied_bed_days"] / (ward_occ["total_beds"] * total_days) * 100
    ).round(1)

    bed_cap = ds.beds.merge(ds.wards[["ward_no","ward_name"]], on="ward_no", how="left") \
                     .groupby("ward_name").size().reset_index(name="capacity")
    ward_occ = ward_occ.merge(bed_cap, on="ward_name", how="left")
    return _rows(ward_occ.sort_values("occupancy_pct"))


def alos(ds: DataStore) -> dict:
    by_room = (
        ds.room_rec.merge(ds.rooms[["room_no","room_type"]], on="room_no", how="left")
        .groupby("room_type")["los"]
        .agg(avg_los="mean", median_los="median", admissions="count")
        .reset_index()
    )
    return {
        "avg_bed_los":  round(float(ds.bed_rec["los"].mean()), 1),
        "avg_room_los": round(float(ds.room_rec["los"].mean()), 1),
        "by_room_type": _rows(by_room),
    }


def readmission_rate(ds: DataStore) -> dict:
    adm = ds.all_admissions.copy()
    adm["prev_disch"] = adm.groupby("patient_id")["discharge_date"].shift(1)
    adm["gap_days"]   = (adm["admission_date"] - adm["prev_disch"]).dt.days
    readmit_count     = int((adm["gap_days"] <= 30).sum())
    unique_admitted   = int(adm["patient_id"].nunique())
    return {
        "patients_admitted": unique_admitted,
        "readmitted_30d":    readmit_count,
        "rate_pct":          round(readmit_count / unique_admitted * 100, 1) if unique_admitted else 0,
        "who_benchmark_pct": 15.0,
    }


def peak_admission_patterns(ds: DataStore) -> dict:
    adm = ds.all_admissions.copy()
    adm["dow"]   = adm["admission_date"].dt.day_name()
    adm["month"] = adm["admission_date"].dt.month_name()
    adm["month_num"] = adm["admission_date"].dt.month

    dow_counts   = adm.groupby("dow").size().reset_index(name="count")
    month_counts = adm.groupby(["month","month_num"]).size().reset_index(name="count") \
                      .sort_values("month_num")
    peak_day   = dow_counts.loc[dow_counts["count"].idxmax(), "dow"]
    peak_month = month_counts.loc[month_counts["count"].idxmax(), "month"]
    return {
        "peak_day":   str(peak_day),
        "peak_month": str(peak_month),
        "by_dow":     _rows(dow_counts),
        "by_month":   _rows(month_counts[["month","count"]]),
        "total_admissions": int(len(adm)),
    }


def shift_coverage(ds: DataStore) -> dict:
    sh = ds.shifts.copy()
    sh["has_doctor"] = sh["doct_id"].notna()
    sh["has_nurse"]  = sh["nurse_id"].notna()
    sh["has_helper"] = sh["helper_id"].notna()
    daily = sh.groupby("shift_date").agg(
        doctors=("has_doctor","sum"),
        nurses=("has_nurse","sum"),
        helpers=("has_helper","sum"),
        total_shifts=("shift_id","count")
    ).reset_index()
    daily["fully_covered"] = (daily["doctors"] > 0) & (daily["nurses"] > 0) & (daily["helpers"] > 0)
    return {
        "total_days":     int(len(daily)),
        "fully_covered":  int(daily["fully_covered"].sum()),
        "gap_days":       int((~daily["fully_covered"]).sum()),
        "coverage_pct":   round(daily["fully_covered"].mean() * 100, 1),
        "by_day":         _rows(daily.assign(shift_date=daily["shift_date"].astype(str))),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CLINICAL
# ═══════════════════════════════════════════════════════════════════════════════

def diagnosis_frequency(ds: DataStore) -> list[dict]:
    top = (
        ds.medical.groupby("diagnosis").size()
        .reset_index(name="count")
        .sort_values("count", ascending=False)
        .head(20)
    )
    total = int(top["count"].sum())
    top["pct"] = (top["count"] / len(ds.medical) * 100).round(1)
    return _rows(top)


def diagnosis_by_season(ds: DataStore) -> list[dict]:
    def get_season(m):
        if m in [12,1,2]: return "Winter"
        if m in [3,4,5]:  return "Spring"
        if m in [6,7,8]:  return "Summer"
        return "Autumn"

    med = ds.medical.copy()
    med["season"] = med["visit_date"].dt.month.map(get_season)
    CHRONIC = ["Type 2 Diabetes","Essential Hypertension","Bronchial Asthma",
               "Migraine Headache","Lumbar Strain","Angina Pectoris","General Checkup"]
    pivot = (
        med[med["diagnosis"].isin(CHRONIC)]
        .groupby(["diagnosis","season"]).size()
        .unstack(fill_value=0)
        .reset_index()
    )
    return _rows(pivot)


def patient_journey_funnel(ds: DataStore) -> list[dict]:
    all_pt   = int(ds.patients["patient_id"].nunique())
    had_appt = int(ds.appointments["patient_id"].nunique())
    had_med  = int(ds.medical["patient_id"].nunique())
    had_adm  = int(ds.all_admissions["patient_id"].nunique())
    had_surg = int(ds.surgery["patient_id"].nunique())
    had_disch= int(ds.all_admissions[ds.all_admissions["discharge_date"].notna()]["patient_id"].nunique())
    stages = [
        {"stage":"Registered",       "count": all_pt,   "pct": 100.0},
        {"stage":"Had Appointment",   "count": had_appt, "pct": round(had_appt/all_pt*100,1)},
        {"stage":"Medical Record",    "count": had_med,  "pct": round(had_med/all_pt*100,1)},
        {"stage":"Admitted",          "count": had_adm,  "pct": round(had_adm/all_pt*100,1)},
        {"stage":"Had Surgery",       "count": had_surg, "pct": round(had_surg/all_pt*100,1)},
        {"stage":"Discharged",        "count": had_disch,"pct": round(had_disch/all_pt*100,1)},
    ]
    return stages


def referral_network(ds: DataStore, top_n: int = 10) -> list[dict]:
    med_dept = (
        ds.medical
        .merge(ds.doctors[["doct_id","dept_id"]], on="doct_id", how="left")
        .merge(ds.departments[["dept_id","dept_name"]], on="dept_id", how="left")
        .sort_values(["patient_id","visit_date"])
        [["patient_id","dept_name","visit_date"]].dropna()
    )
    med_dept["next_dept"] = med_dept.groupby("patient_id")["dept_name"].shift(-1)
    filtered = med_dept.dropna(subset=["next_dept"]).copy()
    filtered = filtered[filtered["dept_name"] != filtered["next_dept"]]
    transitions = (
        filtered
        .groupby(["dept_name","next_dept"]).size()
        .reset_index(name="transitions")
        .sort_values("transitions", ascending=False)
        .head(top_n)
    )
    return _rows(transitions)


def chronic_disease_cohort(ds: DataStore) -> dict:
    CHRONIC = ["Type 2 Diabetes","Essential Hypertension","Bronchial Asthma",
               "Migraine Headache","Lumbar Strain","Angina Pectoris"]
    records = ds.medical[ds.medical["diagnosis"].isin(CHRONIC)]
    counts  = records.groupby(["patient_id","diagnosis"]).size().reset_index(name="visit_count")
    chronic_pts = counts[counts["visit_count"] >= 2]
    multi_cond  = chronic_pts.groupby("patient_id")["diagnosis"].nunique()
    by_diag = (
        chronic_pts.groupby("diagnosis")
        .agg(patients=("patient_id","nunique"), total_visits=("visit_count","sum"))
        .reset_index()
        .sort_values("patients", ascending=False)
    )
    return {
        "total_chronic_patients": int(chronic_pts["patient_id"].nunique()),
        "multi_condition_patients": int((multi_cond >= 2).sum()),
        "by_diagnosis": _rows(by_diag),
    }


def documentation_gap(ds: DataStore) -> dict:
    appt_med = (
        ds.appointments[["patient_id","appointment_date","doct_id"]]
        .merge(ds.medical[["patient_id","visit_date","doct_id"]], on=["patient_id","doct_id"], how="inner")
    )
    appt_med["gap_days"] = (appt_med["visit_date"] - appt_med["appointment_date"]).dt.days
    appt_med = appt_med[(appt_med["gap_days"] >= 0) & (appt_med["gap_days"] <= 90)]
    return {
        "mean_gap_days":   round(float(appt_med["gap_days"].mean()), 1),
        "median_gap_days": round(float(appt_med["gap_days"].median()), 1),
        "same_day_records": int((appt_med["gap_days"] == 0).sum()),
        "total_matched":   int(len(appt_med)),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# APPOINTMENTS
# ═══════════════════════════════════════════════════════════════════════════════

def appointment_status_summary(ds: DataStore) -> list[dict]:
    s = ds.appointments["appointment_status"].value_counts().reset_index()
    s.columns = ["status","count"]
    total = s["count"].sum()
    s["pct"] = (s["count"] / total * 100).round(1)
    return _rows(s)


def noshow_by_mode(ds: DataStore) -> list[dict]:
    mode_status = (
        ds.appointments.groupby(["mode_of_appointment","appointment_status"])
        .size().unstack(fill_value=0).reset_index()
    )
    mode_status["total"] = mode_status.iloc[:, 1:].sum(axis=1)
    for col in ["Completed","Cancelled","No-Show","Scheduled"]:
        if col in mode_status.columns:
            rate_col = col.lower().replace("-","_") + "_rate"
            mode_status[rate_col] = (mode_status[col] / mode_status["total"] * 100).round(1)
    mode_status["problem_rate"] = (
        (mode_status.get("No-Show", 0) + mode_status.get("Cancelled", 0)) /
        mode_status["total"] * 100
    ).round(1)
    return _rows(mode_status)


# ═══════════════════════════════════════════════════════════════════════════════
# STAFF & HR
# ═══════════════════════════════════════════════════════════════════════════════

def staff_headcount(ds: DataStore) -> list[dict]:
    doc_hc   = ds.doctors.groupby("dept_id").size().rename("doctors")
    nurse_hc = ds.nurses.groupby("dept_id").size().rename("nurses")
    help_hc  = ds.helpers.groupby("dept_id").size().rename("helpers")
    hc = (
        ds.departments[["dept_id","dept_name"]]
        .merge(doc_hc,   on="dept_id", how="left")
        .merge(nurse_hc, on="dept_id", how="left")
        .merge(help_hc,  on="dept_id", how="left")
        .fillna(0)
    )
    hc["total"] = hc["doctors"] + hc["nurses"] + hc["helpers"]
    hc = hc.sort_values("total", ascending=False)
    return _rows(hc)


def surgeon_utilisation(ds: DataStore) -> list[dict]:
    surg = ds.surgery.copy()
    surg["surg_start"] = pd.to_datetime(
        surg["surgery_date"].astype(str) + " " + surg["start_time"].astype(str), errors="coerce"
    )
    surg["surg_end"] = pd.to_datetime(
        surg["surgery_date"].astype(str) + " " + surg["end_time"].astype(str), errors="coerce"
    )
    surg["duration_min"] = ((surg["surg_end"] - surg["surg_start"]).dt.total_seconds() / 60).clip(lower=1)
    util = (
        surg.groupby("surgeon_id")
        .agg(total_surgeries=("surgery_id","count"), avg_duration_min=("duration_min","mean"))
        .reset_index()
    )
    doc_names = ds.doctors[["doct_id","fname","lname","surgeon_type"]].copy()
    doc_names["name"] = doc_names["fname"] + " " + doc_names["lname"]
    util = util.merge(doc_names.rename(columns={"doct_id":"surgeon_id"}), on="surgeon_id", how="left")
    return _rows(util.sort_values("total_surgeries", ascending=False).head(20))


def nurse_continuity(ds: DataStore) -> dict:
    bed_nurse  = ds.bed_rec.groupby("patient_id")["nurse_id"].nunique().rename("nurses_bed")
    room_nurse = ds.room_rec.groupby("patient_id")["nurse_id"].nunique().rename("nurses_room")
    combined   = pd.concat([bed_nurse, room_nurse], axis=1).fillna(0)
    combined["total_unique_nurses"] = combined.max(axis=1)
    high_cont  = int((combined["total_unique_nurses"] == 1).sum())
    avg_nurses = round(float(combined["total_unique_nurses"].mean()), 2)
    return {
        "high_continuity_patients": high_cont,
        "avg_unique_nurses_per_patient": avg_nurses,
        "total_patients_with_admission": int(len(combined)),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# SURGERY
# ═══════════════════════════════════════════════════════════════════════════════

def surgical_outcomes(ds: DataStore) -> list[dict]:
    by_type = (
        ds.surgery.groupby(["surgery_type","notes"])
        .size().unstack(fill_value=0).reset_index()
    )
    outcome_cols = [c for c in by_type.columns if c != "surgery_type"]
    by_type["total"] = by_type[outcome_cols].sum(axis=1)
    pos = [c for c in ["Recovered","Stable"] if c in by_type.columns]
    neg = [c for c in ["Transfer to icu","Need special care"] if c in by_type.columns]
    if pos: by_type["positive_rate"] = (by_type[pos].sum(axis=1) / by_type["total"] * 100).round(1)
    if neg: by_type["negative_rate"] = (by_type[neg].sum(axis=1) / by_type["total"] * 100).round(1)
    return _rows(by_type.sort_values("total", ascending=False))


def surgical_outcome_summary(ds: DataStore) -> list[dict]:
    summary = (
        ds.surgery.groupby("notes").size()
        .reset_index(name="count")
        .sort_values("count", ascending=False)
    )
    total = summary["count"].sum()
    summary["pct"] = (summary["count"] / total * 100).round(1)
    return _rows(summary)


# ═══════════════════════════════════════════════════════════════════════════════
# EXPLORER (raw table access)
# ═══════════════════════════════════════════════════════════════════════════════

TABLE_MAP = {
    "patients":     lambda ds: ds.patients,
    "appointments": lambda ds: ds.appointments,
    "medical":      lambda ds: ds.medical,
    "bed_records":  lambda ds: ds.bed_rec,
    "room_records": lambda ds: ds.room_rec,
    "surgery":      lambda ds: ds.surgery,
    "doctors":      lambda ds: ds.doctors,
    "nurses":       lambda ds: ds.nurses,
    "helpers":      lambda ds: ds.helpers,
    "beds":         lambda ds: ds.beds,
    "rooms":        lambda ds: ds.rooms,
    "wards":        lambda ds: ds.wards,
    "departments":  lambda ds: ds.departments,
    "shifts":       lambda ds: ds.shifts,
}


def get_table(ds: DataStore, table: str, page: int = 1, page_size: int = 50) -> dict:
    if table not in TABLE_MAP:
        return {"error": f"Unknown table: {table}"}
    df = TABLE_MAP[table](ds).copy()
    # Convert timestamps to strings for JSON
    for col in df.select_dtypes(include=["datetime64[ns]","datetimetz"]).columns:
        df[col] = df[col].astype(str)
    total = len(df)
    start = (page - 1) * page_size
    page_df = df.iloc[start: start + page_size]
    return {
        "table":     table,
        "total":     total,
        "page":      page,
        "page_size": page_size,
        "pages":     (total + page_size - 1) // page_size,
        "columns":   list(df.columns),
        "rows":      [{k: _safe(v) for k, v in row.items()} for row in page_df.to_dict("records")],
    }
