from typing import Optional
from fastapi import APIRouter, Query
from app.services.data_loader import get_store, filter_store
from app.services import analytics

router = APIRouter()

def _ds(year, month):
    return filter_store(get_store(), year, month)

@router.get("/outcomes")
def outcomes(year: Optional[int]  = Query(None, ge=2000, le=2100),
             month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.surgical_outcomes(_ds(year, month))

@router.get("/outcome-summary")
def outcome_summary(year: Optional[int]  = Query(None, ge=2000, le=2100),
                    month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.surgical_outcome_summary(_ds(year, month))
