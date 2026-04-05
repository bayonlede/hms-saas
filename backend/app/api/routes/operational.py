from fastapi import APIRouter, Query
from app.services.data_loader import get_store
from app.services import analytics

router = APIRouter()

@router.get("/occupancy")
def occupancy(
    start: str = Query("2024-11-01"),
    end:   str = Query("2025-05-31"),
):
    return analytics.occupancy_by_ward(get_store(), start, end)

@router.get("/alos")
def alos():
    return analytics.alos(get_store())

@router.get("/readmission")
def readmission():
    return analytics.readmission_rate(get_store())

@router.get("/peak-patterns")
def peak():
    return analytics.peak_admission_patterns(get_store())

@router.get("/shift-coverage")
def shifts():
    return analytics.shift_coverage(get_store())
