import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ── Excel fallback ────────────────────────────────────────────────────────────
DATA_FILE = os.getenv("DATA_FILE", str(BASE_DIR / "Hospital_Management_System.xlsx"))

# ── PostgreSQL ────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "")

def get_async_db_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url

ASYNC_DATABASE_URL = get_async_db_url(DATABASE_URL) if DATABASE_URL else ""

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,https://*.railway.app"
).split(",")

APP_TITLE   = "HMS Analytics API"
APP_VERSION = "1.0.0"

# True → PostgreSQL, False → Excel fallback
USE_DATABASE = bool(ASYNC_DATABASE_URL)
