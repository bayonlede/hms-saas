from fastapi import APIRouter, Query, HTTPException
from app.services.data_loader import get_store
from app.services.analytics import get_table, TABLE_MAP

router = APIRouter()

@router.get("/tables")
def list_tables():
    return {"tables": list(TABLE_MAP.keys())}

@router.get("/table/{table_name}")
def fetch_table(
    table_name: str,
    page:      int = Query(1,  ge=1),
    page_size: int = Query(50, ge=1, le=500),
):
    if table_name not in TABLE_MAP:
        raise HTTPException(404, f"Table '{table_name}' not found")
    return get_table(get_store(), table_name, page, page_size)
