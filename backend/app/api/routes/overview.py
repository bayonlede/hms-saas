from fastapi import APIRouter
from app.services.data_loader import get_store
from app.services import analytics

router = APIRouter()

@router.get("/kpis")
def kpis():
    return analytics.overview_kpis(get_store())
