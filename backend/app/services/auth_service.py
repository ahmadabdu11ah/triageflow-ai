from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.models import User, UserRole
from app.schemas import UserCreate


class EmailAlreadyRegisteredError(Exception):
    """Raised when attempting to register an email that already exists."""


# A valid hash used to equalize timing when the user does not exist.
_DUMMY_HASH: bytes = bcrypt.hashpw(b"timing-equalizer", bcrypt.gensalt())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, object] = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> int:
    """Return the user id from a token. Raises ``jwt.InvalidTokenError`` if invalid."""
    payload = jwt.decode(
        token,
        settings.secret_key,
        algorithms=[settings.algorithm],
        options={"require": ["sub", "exp"]},
    )
    try:
        return int(payload["sub"])
    except (TypeError, ValueError) as exc:
        raise jwt.InvalidTokenError("Invalid subject claim") from exc


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def register_user(db: Session, data: UserCreate) -> User:
    email = data.email.lower()
    if get_user_by_email(db, email) is not None:
        raise EmailAlreadyRegisteredError(email)

    user = User(
        email=email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role=UserRole.REPORTER.value,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise EmailAlreadyRegisteredError(email) from exc
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None:
        bcrypt.checkpw(password.encode("utf-8")[:72], _DUMMY_HASH)
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
