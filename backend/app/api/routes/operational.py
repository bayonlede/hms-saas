from typing import Optional
from fastapi import APIRouter, Query
from app.services.data_loader import get_store, filter_store
from app.services import analytics

router = APIRouter()

def _ds(year, month):
    return filter_store(get_store(), year, month)

@router.get("/occupancy")
def occupancy(start: str = '2024-11-01', end: str = '2025-05-31',
              year: Optional[int]  = Query(None, ge=2000, le=2100),
              month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.occupancy_by_ward(_ds(year, month), start, end)

@router.get("/alos")
def alos(year: Optional[int]  = Query(None, ge=2000, le=2100),
         month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.alos(_ds(year, month))

@router.get("/readmission")
def readmission(year: Optional[int]  = Query(None, ge=2000, le=2100),
                month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.readmission_rate(_ds(year, month))

@router.get("/peak-patterns")
def peak_patterns(year: Optional[int]  = Query(None, ge=2000, le=2100),
                  month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.peak_admission_patterns(_ds(year, month))

@router.get("/shift-coverage")
def shift_coverage(year: Optional[int]  = Query(None, ge=2000, le=2100),
                   month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.shift_coverage(_ds(year, month))
