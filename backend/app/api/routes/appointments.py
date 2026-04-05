from fastapi import APIRouter
from app.services.data_loader import get_store
from app.services import analytics

router = APIRouter()

@router.get("/status-summary")
def status_summary():
    return analytics.appointment_status_summary(get_store())

@router.get("/noshow-by-mode")
def noshow_mode():
    return analytics.noshow_by_mode(get_store())
