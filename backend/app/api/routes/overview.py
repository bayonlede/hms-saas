from typing import Optional
from fastapi import APIRouter, Query
from app.services.data_loader import get_store, filter_store
from app.services import analytics

router = APIRouter()

@router.get("/kpis")
def kpis(year: Optional[int]  = Query(None, ge=2000, le=2100),
         month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.overview_kpis(filter_store(get_store(), year, month))
