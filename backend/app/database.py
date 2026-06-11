from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _engine_kwargs() -> dict:
    """Dialect-specific kwargs for create_async_engine.

    - SQLite: relax the same-thread check so the async wrapper can pool.
    - asyncpg + Supabase transaction pooler (port 6543) is pgBouncer in
      transaction mode, which discards named prepared statements between
      queries. asyncpg caches them by default and breaks. Disable both
      caches — harmless on direct Postgres, required behind pgBouncer.
    """
    if settings.is_sqlite:
        return {"connect_args": {"check_same_thread": False}}
    if "+asyncpg" in settings.DATABASE_URL:
        return {
            "connect_args": {
                "statement_cache_size": 0,
                "prepared_statement_cache_size": 0,
            },
        }
    return {}


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    **_engine_kwargs(),
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
