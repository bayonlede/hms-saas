from typing import Optional
from fastapi import APIRouter, Query
from app.services.data_loader import get_store, filter_store
from app.services import analytics

router = APIRouter()

def _ds(year, month):
    return filter_store(get_store(), year, month)

@router.get("/revenue-by-department")
def rev_dept(year: Optional[int]  = Query(None, ge=2000, le=2100),
             month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.revenue_by_department(_ds(year, month))

@router.get("/payment-mode-summary")
def pay_summary(year: Optional[int]  = Query(None, ge=2000, le=2100),
                month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.payment_mode_summary(_ds(year, month))

@router.get("/payment-mode-trend")
def pay_trend(year: Optional[int]  = Query(None, ge=2000, le=2100),
              month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.payment_mode_trend(_ds(year, month))

@router.get("/revenue-per-day")
def rev_per_day(year: Optional[int]  = Query(None, ge=2000, le=2100),
                month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.revenue_per_day_by_room_type(_ds(year, month))

@router.get("/at-risk-revenue")
def at_risk(year: Optional[int]  = Query(None, ge=2000, le=2100),
            month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.at_risk_revenue(_ds(year, month))

@router.get("/top-patients")
def top_patients(n: int = Query(10, ge=1, le=50),
                 year: Optional[int]  = Query(None, ge=2000, le=2100),
                 month: Optional[int] = Query(None, ge=1,    le=12)):
    return analytics.top_revenue_patients(_ds(year, month), n)
