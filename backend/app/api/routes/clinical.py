from fastapi import APIRouter
from app.services.data_loader import get_store
from app.services import analytics

router = APIRouter()

@router.get("/diagnoses")
def diagnoses():
    return analytics.diagnosis_frequency(get_store())

@router.get("/diagnoses-by-season")
def diag_season():
    return analytics.diagnosis_by_season(get_store())

@router.get("/patient-journey")
def journey():
    return analytics.patient_journey_funnel(get_store())

@router.get("/referral-network")
def referrals():
    return analytics.referral_network(get_store())

@router.get("/chronic-cohort")
def chronic():
    return analytics.chronic_disease_cohort(get_store())

@router.get("/documentation-gap")
def doc_gap():
    return analytics.documentation_gap(get_store())
