"""
db/session.py
─────────────
Async SQLAlchemy engine + session factory.
The engine is created lazily on first use so that import does not fail
when DATABASE_URL is not set (Excel-only mode).
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import ASYNC_DATABASE_URL

_engine        = None
_session_maker = None


def _get_engine():
    global _engine
    if _engine is None:
        if not ASYNC_DATABASE_URL:
            raise RuntimeError("DATABASE_URL is not configured.")
        _engine = create_async_engine(
            ASYNC_DATABASE_URL,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,   # detect stale connections
            echo=False,
        )
    return _engine


def get_session_maker() -> async_sessionmaker[AsyncSession]:
    global _session_maker
    if _session_maker is None:
        _session_maker = async_sessionmaker(
            bind=_get_engine(),
            expire_on_commit=False,
            class_=AsyncSession,
        )
    return _session_maker


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields an async session."""
    async with get_session_maker()() as session:
        yield session
