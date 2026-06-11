FROM python:3.12.7-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps for asyncpg and cryptography wheels
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential libpq-dev \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app
COPY seed.py seed_descriptions.py seed_grower_logos.py ./
# Seeded image assets ship with the image so first deploy isn't blank.
# A Railway volume mounted at /app/uploads will overlay this directory
# on subsequent boots, so anything written at runtime survives redeploys.
COPY uploads ./uploads

EXPOSE 8000

# Railway sets $PORT. Default to 8000 for local `docker run` use.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
