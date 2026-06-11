import uuid
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _build_engine():
    """Build the async engine with dialect-specific settings.

    SQLite (local dev): relax same-thread check so the async pool works.

    asyncpg + Supabase transaction pooler (port 6543) is pgBouncer in
    transaction mode. It rotates each client across backends per-transaction,
    so named prepared statements created in one transaction don't exist when
    the next reuses the same name on a different backend. Three pieces:

      1. URL query `?prepared_statement_cache_size=0` disables SQLAlchemy's
         dialect-level statement cache (this option is read from the URL,
         not from a create_async_engine kwarg).
      2. connect_args.statement_cache_size=0 disables asyncpg's own cache.
      3. connect_args.prepared_statement_name_func returns a unique
         uuid-suffixed name on every call, so even unavoidable PREPAREs
         never collide with anything pgBouncer has seen before.
    """
    if settings.is_sqlite:
        return create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            connect_args={"check_same_thread": False},
        )

    if "+asyncpg" in settings.DATABASE_URL:
        url = settings.DATABASE_URL
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}prepared_statement_cache_size=0"
        return create_async_engine(
            url,
            echo=False,
            connect_args={
                "statement_cache_size": 0,
                "prepared_statement_name_func": lambda: f"__asyncpg_{uuid.uuid4().hex}__",
            },
        )

    return create_async_engine(settings.DATABASE_URL, echo=False)


engine = _build_engine()

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
