# DataStrain OS — Developer Instructions

## Overview
DataStrain is a gamified review platform for UK medical cannabis patients. "Top Trumps" card mechanic for strain discovery.

## Tech Stack
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Alembic, Pydantic v2
- **Database:** Supabase PostgreSQL (prod), SQLite + aiosqlite (local dev)
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Auth:** Firebase Google OAuth (admin), Email + password JWT (patients)
- **Image Storage:** Local `uploads/` dir (dev), Google Cloud Storage (prod)

## Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --port 8001 --reload
```
API docs: http://localhost:8001/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:3000

### Database Migrations
```bash
cd backend
alembic upgrade head          # apply migrations
alembic revision --autogenerate -m "description"  # create migration
```

## Key Patterns
- All SQLAlchemy models use `Mapped[]` and `mapped_column()` (SA 2.0 style)
- Pydantic schemas in `backend/app/schemas/` — one file per domain
- API routers in `backend/app/routers/` — mounted at `/api/v1/`
- Patient auth: JWT in `Authorization: Bearer <token>` header
- Admin auth: Firebase ID token in `Authorization: Bearer <token>` header
- Denormalized counts (review_count, follower_count, helpful_votes) updated in-transaction
- `ActivityLog.detail` stored as JSON-serialized Text (SQLite compatible)

## Environment Variables

### Backend (.env)
- `DATABASE_URL` — `sqlite+aiosqlite:///./datastrain.db` for local dev
- `SECRET_KEY` — JWT signing key
- `FIREBASE_CREDENTIALS_PATH` — path to Firebase service account JSON
- `GCS_BUCKET_NAME` — Google Cloud Storage bucket
- `CORS_ORIGINS` — comma-separated allowed origins

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` — `http://localhost:8001/api/v1`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
