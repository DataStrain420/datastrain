from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./datastrain.db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    FIREBASE_CREDENTIALS_PATH: str = ""
    GCS_BUCKET_NAME: str = ""
    CORS_ORIGINS: str = "http://localhost:3000"
    # Comma-separated list of Google email addresses that may access the
    # admin API. Empty by default — an empty list means NOBODY is an admin,
    # which locks the panel down until the operator has explicitly named
    # someone. get_current_admin cross-checks Firebase-verified emails
    # against this list.
    ADMIN_EMAILS: str = ""
    # When true, the FastAPI lifespan calls Base.metadata.create_all on startup.
    # Safe for SQLite dev and preview Postgres (only creates missing tables).
    # Set false in real prod once alembic migrations are the source of truth.
    AUTO_CREATE_TABLES: bool = True

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def admin_email_list(self) -> list[str]:
        return [e.strip().lower() for e in self.ADMIN_EMAILS.split(",") if e.strip()]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
