import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_FILE = os.getenv("DATA_FILE", str(BASE_DIR / "Hospital_Management_System.xlsx"))

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,https://*.railway.app"
).split(",")

APP_TITLE = "HMS Analytics API"
APP_VERSION = "1.0.0"
