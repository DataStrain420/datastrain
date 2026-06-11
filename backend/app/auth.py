from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import User

# ─── Password hashing ────────────────────────────────────────────────────────


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ─── JWT ──────────────────────────────────────────────────────────────────────

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login", auto_error=False)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])


# ─── Patient auth dependency ─────────────────────────────────────────────────


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(status_code=401, detail="Invalid token: no sub claim")
        user_id = int(sub)
    except JWTError as e:
        print(f"[AUTH] JWT decode failed: {e}")
        print(f"[AUTH] Token (first 50 chars): {token[:50]}...")
        print(f"[AUTH] SECRET_KEY (first 10 chars): {settings.SECRET_KEY[:10]}...")
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


async def get_optional_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Like get_current_user but returns None instead of 401 if unauthenticated."""
    if token is None:
        return None
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if sub is None:
            return None
        user_id = int(sub)
    except (JWTError, ValueError):
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        return None
    return user


# ─── Admin auth dependency (Firebase) ────────────────────────────────────────

_firebase_initialized = False


def _init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return
    if not settings.FIREBASE_CREDENTIALS_PATH:
        return
    try:
        import firebase_admin
        from firebase_admin import credentials

        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
    except Exception:
        pass


async def get_current_admin(
    authorization: str = Header(None),
) -> dict:
    """Verify Firebase ID token for admin access.

    In dev mode without Firebase credentials, accepts a header value of
    'Bearer dev-admin' for testing.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin authentication required")

    token = authorization[7:]

    # Dev bypass when Firebase is not configured
    if not settings.FIREBASE_CREDENTIALS_PATH:
        if token == "dev-admin":
            return {"uid": "dev-admin", "email": "admin@datastrain.co.uk"}
        raise HTTPException(
            status_code=401,
            detail="Firebase not configured. Use 'Bearer dev-admin' for dev mode.",
        )

    _init_firebase()

    try:
        from firebase_admin import auth

        decoded = auth.verify_id_token(token)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid admin token")
