import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create any missing tables on startup (SQLite dev and preview Postgres).
    # In real prod, set AUTO_CREATE_TABLES=false and let alembic own the schema.
    if settings.AUTO_CREATE_TABLES:
        from app import models  # noqa: F401

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="DataStrain API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images in dev
uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


# ─── Health check ─────────────────────────────────────────────────────────────


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok"}


# ─── Routers ──────────────────────────────────────────────────────────────────

from app.routers import admin, batches, clinics, growers, library, pharmacies, reviews, search, strains, users  # noqa: E402

app.include_router(users.router, prefix="/api/v1")
app.include_router(strains.router, prefix="/api/v1")
app.include_router(batches.router, prefix="/api/v1")
app.include_router(growers.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(pharmacies.router, prefix="/api/v1")
app.include_router(clinics.router, prefix="/api/v1")
app.include_router(library.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
