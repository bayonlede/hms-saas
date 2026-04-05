"""
main.py  —  HMS Analytics API
FastAPI application wired with all routers and CORS.
Supports both PostgreSQL (production) and Excel (local/fallback) data sources.
"""
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import APP_TITLE, APP_VERSION, USE_DATABASE, ASYNC_DATABASE_URL
from app.services.data_loader import get_store
from app.api.routes import (
    overview, financial, operational, clinical,
    appointments, staff, surgery, explorer, predict,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    source = "PostgreSQL" if USE_DATABASE else "Excel file"
    print(f"Loading HMS data from {source}...")
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, get_store)
        print("Data loaded successfully")
    except Exception as e:
        print(f"Data load failed: {e}")
        raise
    yield
    print("Shutting down")


app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description="Hospital Management System — Analytics REST API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(overview.router,     prefix="/api/overview",     tags=["Overview"])
app.include_router(financial.router,    prefix="/api/financial",    tags=["Financial"])
app.include_router(operational.router,  prefix="/api/operational",  tags=["Operational"])
app.include_router(clinical.router,     prefix="/api/clinical",     tags=["Clinical"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(staff.router,        prefix="/api/staff",        tags=["Staff"])
app.include_router(surgery.router,      prefix="/api/surgery",      tags=["Surgery"])
app.include_router(explorer.router,     prefix="/api/explorer",     tags=["Explorer"])
app.include_router(predict.router,      prefix="/api/predict",      tags=["Prediction"])


@app.get("/health")
async def health():
    ds = get_store()
    return {
        "status":       "ok",
        "version":      APP_VERSION,
        "data_source":  "postgresql" if USE_DATABASE else "excel",
        "patients":     len(ds.patients),
        "appointments": len(ds.appointments),
    }


@app.get("/api/db-status")
async def db_status():
    """Shows which data source is active and live record counts."""
    ds = get_store()
    return {
        "data_source":     "postgresql" if USE_DATABASE else "excel",
        "database_url_set": bool(ASYNC_DATABASE_URL),
        "record_counts": {
            "patients":      len(ds.patients),
            "appointments":  len(ds.appointments),
            "medical":       len(ds.medical),
            "bed_records":   len(ds.bed_rec),
            "room_records":  len(ds.room_rec),
            "surgery":       len(ds.surgery),
            "doctors":       len(ds.doctors),
            "nurses":        len(ds.nurses),
            "helpers":       len(ds.helpers),
            "beds":          len(ds.beds),
            "rooms":         len(ds.rooms),
            "wards":         len(ds.wards),
            "departments":   len(ds.departments),
            "shifts":        len(ds.shifts),
        }
    }


@app.get("/")
async def root():
    return {"message": "HMS Analytics API", "docs": "/docs"}
