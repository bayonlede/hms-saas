from fastapi import APIRouter
from app.services.data_loader import get_store
from app.services import analytics

router = APIRouter()

@router.get("/headcount")
def headcount():
    return analytics.staff_headcount(get_store())

@router.get("/surgeon-utilisation")
def surgeon_util():
    return analytics.surgeon_utilisation(get_store())

@router.get("/nurse-continuity")
def nurse_cont():
    return analytics.nurse_continuity(get_store())
