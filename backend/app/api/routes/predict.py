"""
predict.py
──────────
No-show prediction endpoints using the saved Logistic Regression model.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

from app.services.data_loader import get_store
from app.services import ml_service

router = APIRouter()


# ── Bulk risk scores ──────────────────────────────────────────────────────────

@router.get("/risk-scores")
def risk_scores():
    """Score all known-outcome appointments and return risk distribution."""
    if not ml_service.model_available():
        raise HTTPException(503, "ML model not loaded — copy model/lr_model.pkl to the backend directory")
    return ml_service.score_all_appointments(get_store())


# ── Single-appointment prediction ─────────────────────────────────────────────

class PredictRequest(BaseModel):
    appt_mode:         Literal["Call", "In Person", "Online"]
    payment_mode:      Literal["Card", "Cash", "Digital Wallet", "Insurance"]
    visit_reason:      Literal[
        "Asthma", "Back Pain", "Chest Pain", "Diabetes",
        "Fever", "General Checkup", "Headache", "Hypertension", "Migraine"
    ]
    gender:            Literal["F", "M"]
    age:               int   = Field(..., ge=0, le=120)
    dow:               int   = Field(..., ge=0, le=6,  description="0=Mon … 6=Sun")
    month:             int   = Field(..., ge=1, le=12)
    is_weekend:        int   = Field(..., ge=0, le=1)
    appt_sequence:     int   = Field(..., ge=1,        description="Patient's nth appointment")
    prior_noshow:      int   = Field(..., ge=0,        description="Count of past no-shows")
    prior_noshow_rate: float = Field(..., ge=0, le=1,  description="Fraction of past appointments missed")


@router.post("/predict")
def predict(req: PredictRequest):
    """Predict no-show risk for a single upcoming appointment."""
    if not ml_service.model_available():
        raise HTTPException(503, "ML model not loaded")
    return ml_service.predict_single(
        appt_mode         = req.appt_mode,
        payment_mode      = req.payment_mode,
        visit_reason      = req.visit_reason,
        gender            = req.gender,
        age               = req.age,
        dow               = req.dow,
        month             = req.month,
        is_weekend        = req.is_weekend,
        appt_sequence     = req.appt_sequence,
        prior_noshow      = req.prior_noshow,
        prior_noshow_rate = req.prior_noshow_rate,
        ds                = get_store(),
    )
