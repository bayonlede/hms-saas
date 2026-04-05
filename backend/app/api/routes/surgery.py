from fastapi import APIRouter
from app.services.data_loader import get_store
from app.services import analytics

router = APIRouter()

@router.get("/outcomes")
def outcomes():
    return analytics.surgical_outcomes(get_store())

@router.get("/outcome-summary")
def outcome_summary():
    return analytics.surgical_outcome_summary(get_store())
