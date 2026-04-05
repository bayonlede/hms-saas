from typing import Optional
from fastapi import APIRouter, Query
from app.services.data_loader import get_store, filter_store
from app.services import analytics

router = APIRouter()

def _ds(year, month):
    return filter_store(get_store(), year, month)

@router.get("/status-summary")
def status_summary(year: Optional[int]  = Query(None, ge=2000, le=2100),
                   month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.appointment_status_summary(_ds(year, month))

@router.get("/noshow-by-mode")
def noshow_mode(year: Optional[int]  = Query(None, ge=2000, le=2100),
                month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.noshow_by_mode(_ds(year, month))
