import uuid
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _engine_kwargs() -> dict:
    """Dialect-specific kwargs for create_async_engine.

    - SQLite: relax the same-thread check so the async wrapper can pool.
    - asyncpg + Supabase transaction pooler (port 6543) is pgBouncer in
      transaction mode. It pins each client to a backend only for the
      duration of a transaction, so named prepared statements created in
      one transaction don't exist when the next transaction reuses the
      same name on a different backend. Two changes are required:
        1. Top-level prepared_statement_cache_size=0 disables SQLAlchemy's
           dialect-level cache so it never tries to reuse a name.
        2. prepared_statement_name_func gives every PREPARE a unique
           uuid-suffixed name, so even if asyncpg sends one inside a
           transaction it can't collide with anything pgBouncer has seen.
       statement_cache_size=0 also disables asyncpg's own client cache.
    """
    if settings.is_sqlite:
        return {"connect_args": {"check_same_thread": False}}
    if "+asyncpg" in settings.DATABASE_URL:
        return {
            "prepared_statement_cache_size": 0,
            "connect_args": {
                "statement_cache_size": 0,
                "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4().hex}__",
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
