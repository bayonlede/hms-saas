"""
main.py  —  HMS Analytics API
FastAPI application wired with all routers and CORS.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import APP_TITLE, APP_VERSION, ALLOWED_ORIGINS
from app.services.data_loader import get_store
from app.api.routes import overview, financial, operational, clinical, appointments, staff, surgery, explorer


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load and cache data on startup
    print("⏳ Loading HMS data…")
    get_store()
    print("✅ Data loaded successfully")
    yield
    print("🛑 Shutting down")


app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description="Hospital Management System — Analytics REST API",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # restrict in production via ALLOWED_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(overview.router,     prefix="/api/overview",     tags=["Overview"])
app.include_router(financial.router,    prefix="/api/financial",    tags=["Financial"])
app.include_router(operational.router,  prefix="/api/operational",  tags=["Operational"])
app.include_router(clinical.router,     prefix="/api/clinical",     tags=["Clinical"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(staff.router,        prefix="/api/staff",        tags=["Staff"])
app.include_router(surgery.router,      prefix="/api/surgery",      tags=["Surgery"])
app.include_router(explorer.router,     prefix="/api/explorer",     tags=["Explorer"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": APP_VERSION}


@app.get("/")
async def root():
    return {"message": "HMS Analytics API", "docs": "/docs"}
