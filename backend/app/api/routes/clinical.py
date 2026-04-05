from typing import Optional
from fastapi import APIRouter, Query
from app.services.data_loader import get_store, filter_store
from app.services import analytics

router = APIRouter()

def _ds(year, month):
    return filter_store(get_store(), year, month)

@router.get("/diagnoses")
def diagnoses(year: Optional[int]  = Query(None, ge=2000, le=2100),
              month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.diagnosis_frequency(_ds(year, month))

@router.get("/diagnoses-by-season")
def diag_season(year: Optional[int]  = Query(None, ge=2000, le=2100),
                month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.diagnosis_by_season(_ds(year, month))

@router.get("/patient-journey")
def journey(year: Optional[int]  = Query(None, ge=2000, le=2100),
            month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.patient_journey_funnel(_ds(year, month))

@router.get("/referral-network")
def referrals(year: Optional[int]  = Query(None, ge=2000, le=2100),
              month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.referral_network(_ds(year, month))

@router.get("/chronic-cohort")
def chronic(year: Optional[int]  = Query(None, ge=2000, le=2100),
            month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.chronic_disease_cohort(_ds(year, month))

@router.get("/documentation-gap")
def doc_gap(year: Optional[int]  = Query(None, ge=2000, le=2100),
            month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.documentation_gap(_ds(year, month))
