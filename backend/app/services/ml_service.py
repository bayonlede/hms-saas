"""
ml_service.py
─────────────
Loads the saved Logistic Regression model and provides
no-show risk scoring, reproducing the exact notebook preprocessing.
"""
import os
import joblib
import pandas as pd
import numpy as np
from functools import lru_cache
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from app.services.data_loader import DataStore

MODEL_PATH = os.getenv("MODEL_PATH", "model/lr_model.pkl")

# ── Constants matching notebook ───────────────────────────────────────────────
FEATURE_COLS = [
    "appt_mode", "payment_mode", "dow", "month", "is_weekend",
    "age", "appt_sequence", "prior_noshow", "prior_noshow_rate",
    "visit_reason", "gender",
]
CATEGORICAL_COLS = ["appt_mode", "payment_mode", "visit_reason", "gender"]

# All one-hot columns (drop_first=True alphabetical order, baseline = first)
# appt_mode baseline=Call; payment_mode baseline=Card;
# visit_reason baseline=Asthma; gender baseline=F
OH_COLUMNS = [
    "dow", "month", "is_weekend", "age", "appt_sequence",
    "prior_noshow", "prior_noshow_rate",
    "appt_mode_In Person", "appt_mode_Online",
    "payment_mode_Cash", "payment_mode_Digital Wallet", "payment_mode_Insurance",
    "visit_reason_Back Pain", "visit_reason_Chest Pain", "visit_reason_Diabetes",
    "visit_reason_Fever", "visit_reason_General Checkup", "visit_reason_Headache",
    "visit_reason_Hypertension", "visit_reason_Migraine",
    "gender_M",
]

HIGH_THRESHOLD   = 0.70
MEDIUM_THRESHOLD = 0.45

RISK_ACTIONS = {
    "HIGH":   "📞 Call + SMS — flag for overbooking slot",
    "MEDIUM": "📱 SMS + 24-hr confirmation request",
    "LOW":    "📧 Standard reminder only",
}


# ── Model loading ─────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def load_model():
    """Load the saved Logistic Regression model (cached after first call)."""
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        return joblib.load(MODEL_PATH)


def model_available() -> bool:
    try:
        load_model()
        return True
    except Exception:
        return False


# ── Feature engineering (mirrors notebook steps 3–5) ─────────────────────────

def _build_raw_features(ds: DataStore) -> pd.DataFrame:
    """Reproduce notebook feature engineering from DataStore."""
    appts = ds.appointments.copy()
    patients = ds.patients[["patient_id", "date_of_birth", "gender"]].copy()

    # Only known outcomes (same filter as training)
    feat = appts[
        appts["appointment_status"].isin(["Completed", "No-Show", "Cancelled"])
    ].copy()

    # Target: 0 = showed, 1 = no-show / cancelled
    feat["target"] = (feat["appointment_status"] != "Completed").astype(int)

    # Merge demographics
    feat = feat.merge(patients, on="patient_id", how="left")

    # Age
    feat["age"] = (
        (feat["appointment_date"] - feat["date_of_birth"]).dt.days / 365.25
    ).round(0).clip(0, 120).fillna(0).astype(int)

    # Date features
    feat["dow"]        = feat["appointment_date"].dt.dayofweek
    feat["month"]      = feat["appointment_date"].dt.month
    feat["is_weekend"] = feat["dow"].isin([5, 6]).astype(int)

    # Rename to match notebook names
    feat = feat.rename(columns={
        "mode_of_appointment": "appt_mode",
        "mode_of_payment":     "payment_mode",
        "reason":              "visit_reason",
    })

    # Appointment sequence (proxy for lead time)
    feat = feat.sort_values(["patient_id", "appointment_date"])
    feat["appt_sequence"] = feat.groupby("patient_id").cumcount() + 1

    # Prior no-show count (look-ahead prevented via shift)
    feat["prior_noshow"] = (
        feat.groupby("patient_id")["target"]
        .apply(lambda x: x.shift(1).fillna(0).cumsum())
        .reset_index(level=0, drop=True)
    )

    # Prior no-show rate
    prior_count = feat.groupby("patient_id").cumcount()  # 0 for first appt
    feat["prior_noshow_rate"] = (
        feat["prior_noshow"] / prior_count.clip(lower=1)
    ).round(3)

    return feat


def _build_matrix(feat: pd.DataFrame):
    """One-hot encode and return (X_df, y_series, meta_df)."""
    model_df = feat[
        FEATURE_COLS + ["target", "patient_id", "appointment_id", "appointment_date", "appointment_status"]
    ].dropna()

    X_df = pd.get_dummies(model_df[FEATURE_COLS], columns=CATEGORICAL_COLS, drop_first=True)

    # Align to exact training columns (add missing with 0, drop extra)
    for col in OH_COLUMNS:
        if col not in X_df.columns:
            X_df[col] = 0
    X_df = X_df[OH_COLUMNS]

    y = model_df["target"]
    meta = model_df[["patient_id", "appointment_id", "appointment_date", "appointment_status", "target"]].copy()

    return X_df, y, meta


def _fit_scaler(X_df: pd.DataFrame, y: pd.Series) -> StandardScaler:
    """
    Reproduce the notebook's scaler by fitting on the same 80% training split.
    random_state=42 + stratify guarantees identical split to training.
    """
    X_train, _, _, _ = train_test_split(
        X_df, y, test_size=0.20, random_state=42, stratify=y
    )
    scaler = StandardScaler()
    scaler.fit(X_train)
    return scaler


# ── Bulk scoring ──────────────────────────────────────────────────────────────

def score_all_appointments(ds: DataStore) -> dict:
    """Score every known-outcome appointment. Returns risk summary + detail list."""
    model  = load_model()
    feat   = _build_raw_features(ds)
    X_df, y, meta = _build_matrix(feat)

    scaler  = _fit_scaler(X_df, y)
    X_scaled = scaler.transform(X_df)

    probs = model.predict_proba(X_scaled)[:, 1]

    meta = meta.copy()
    meta["noshow_probability"] = probs
    meta["noshow_risk_pct"]    = (probs * 100).round(1)
    meta["risk_tier"] = pd.cut(
        probs,
        bins=[-0.001, MEDIUM_THRESHOLD, HIGH_THRESHOLD, 1.001],
        labels=["LOW", "MEDIUM", "HIGH"],
    ).astype(str)
    meta["recommended_action"] = meta["risk_tier"].map(RISK_ACTIONS)
    meta["appointment_date"]   = meta["appointment_date"].astype(str)

    # Risk tier distribution
    tier_counts = meta["risk_tier"].value_counts()
    total = len(meta)

    high_risk = meta[meta["risk_tier"] == "HIGH"].sort_values(
        "noshow_probability", ascending=False
    ).head(20)

    return {
        "total_scored": total,
        "risk_distribution": {
            "HIGH":   int(tier_counts.get("HIGH", 0)),
            "MEDIUM": int(tier_counts.get("MEDIUM", 0)),
            "LOW":    int(tier_counts.get("LOW", 0)),
        },
        "high_risk_count":   int(tier_counts.get("HIGH", 0)),
        "medium_risk_count": int(tier_counts.get("MEDIUM", 0)),
        "low_risk_count":    int(tier_counts.get("LOW", 0)),
        "high_risk_pct": round(tier_counts.get("HIGH", 0) / total * 100, 1) if total else 0,
        "avg_risk_pct":  round(float(probs.mean() * 100), 1),
        "high_risk_appointments": [
            {
                "patient_id":       int(r["patient_id"]),
                "appointment_id":   int(r["appointment_id"]),
                "appointment_date": r["appointment_date"],
                "status":           r["appointment_status"],
                "risk_pct":         float(r["noshow_risk_pct"]),
                "risk_tier":        r["risk_tier"],
                "action":           r["recommended_action"],
            }
            for _, r in high_risk.iterrows()
        ],
        # Histogram data (10 buckets 0-100%)
        "risk_histogram": _histogram(probs),
    }


def _histogram(probs: np.ndarray) -> list[dict]:
    counts, edges = np.histogram(probs, bins=10, range=(0, 1))
    return [
        {
            "bucket": f"{int(edges[i]*100)}–{int(edges[i+1]*100)}%",
            "count":  int(counts[i]),
        }
        for i in range(len(counts))
    ]


# ── Single-appointment prediction ─────────────────────────────────────────────

def predict_single(
    appt_mode: str,
    payment_mode: str,
    visit_reason: str,
    gender: str,
    age: int,
    dow: int,
    month: int,
    is_weekend: int,
    appt_sequence: int,
    prior_noshow: int,
    prior_noshow_rate: float,
    ds: DataStore,
) -> dict:
    """Predict no-show risk for a single appointment."""
    model = load_model()
    feat  = _build_raw_features(ds)
    X_df, y, _ = _build_matrix(feat)
    scaler = _fit_scaler(X_df, y)

    # Build single-row feature dict
    row = {
        "dow":               dow,
        "month":             month,
        "is_weekend":        is_weekend,
        "age":               age,
        "appt_sequence":     appt_sequence,
        "prior_noshow":      prior_noshow,
        "prior_noshow_rate": prior_noshow_rate,
        "appt_mode_In Person":        1 if appt_mode == "In Person" else 0,
        "appt_mode_Online":           1 if appt_mode == "Online"    else 0,
        "payment_mode_Cash":           1 if payment_mode == "Cash"           else 0,
        "payment_mode_Digital Wallet": 1 if payment_mode == "Digital Wallet" else 0,
        "payment_mode_Insurance":      1 if payment_mode == "Insurance"      else 0,
        "visit_reason_Back Pain":      1 if visit_reason == "Back Pain"      else 0,
        "visit_reason_Chest Pain":     1 if visit_reason == "Chest Pain"     else 0,
        "visit_reason_Diabetes":       1 if visit_reason == "Diabetes"       else 0,
        "visit_reason_Fever":          1 if visit_reason == "Fever"          else 0,
        "visit_reason_General Checkup":1 if visit_reason == "General Checkup"else 0,
        "visit_reason_Headache":       1 if visit_reason == "Headache"       else 0,
        "visit_reason_Hypertension":   1 if visit_reason == "Hypertension"   else 0,
        "visit_reason_Migraine":       1 if visit_reason == "Migraine"       else 0,
        "gender_M":                    1 if gender == "M"                    else 0,
    }

    X_single = pd.DataFrame([row])[OH_COLUMNS]
    X_scaled  = scaler.transform(X_single)
    prob      = float(model.predict_proba(X_scaled)[0, 1])

    tier = "HIGH" if prob >= HIGH_THRESHOLD else ("MEDIUM" if prob >= MEDIUM_THRESHOLD else "LOW")

    return {
        "noshow_probability": round(prob, 4),
        "noshow_risk_pct":    round(prob * 100, 1),
        "risk_tier":          tier,
        "recommended_action": RISK_ACTIONS[tier],
    }
