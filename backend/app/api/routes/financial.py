from fastapi import APIRouter, Query
from app.services.data_loader import get_store
from app.services import analytics

router = APIRouter()

@router.get("/revenue-by-department")
def rev_dept():
    return analytics.revenue_by_department(get_store())

@router.get("/payment-mode-summary")
def pay_summary():
    return analytics.payment_mode_summary(get_store())

@router.get("/payment-mode-trend")
def pay_trend():
    return analytics.payment_mode_trend(get_store())

@router.get("/revenue-per-day")
def rev_per_day():
    return analytics.revenue_per_day_by_room_type(get_store())

@router.get("/at-risk-revenue")
def at_risk():
    return analytics.at_risk_revenue(get_store())

@router.get("/top-patients")
def top_patients(n: int = Query(10, ge=1, le=50)):
    return analytics.top_revenue_patients(get_store(), n)
