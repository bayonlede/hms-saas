from typing import Optional
from fastapi import APIRouter, Query
from app.services.data_loader import get_store, filter_store
from app.services import analytics

router = APIRouter()

def _ds(year, month):
    return filter_store(get_store(), year, month)

@router.get("/headcount")
def headcount(year: Optional[int]  = Query(None, ge=2000, le=2100),
              month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.staff_headcount(_ds(year, month))

@router.get("/surgeon-utilisation")
def surgeon_util(year: Optional[int]  = Query(None, ge=2000, le=2100),
                 month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.surgeon_utilisation(_ds(year, month))

@router.get("/nurse-continuity")
def nurse_cont(year: Optional[int]  = Query(None, ge=2000, le=2100),
               month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.nurse_continuity(_ds(year, month))
