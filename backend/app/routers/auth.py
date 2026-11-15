from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import Token, UserCreate, UserLogin, UserRead
from app.services import auth_service
from app.services.auth_service import EmailAlreadyRegisteredError

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _token_for(user: User) -> Token:
    return Token(
        access_token=auth_service.create_access_token(user.id),
        user=UserRead.model_validate(user),
    )


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user and return an access token",
    responses={409: {"description": "Email already registered"}},
)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> Token:
    try:
        user = auth_service.register_user(db, payload)
    except EmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        ) from None
    return _token_for(user)


@router.post(
    "/login",
    response_model=Token,
    summary="Log in with email and password",
    responses={
        401: {"description": "Invalid email or password"},
        403: {"description": "User account is inactive"},
    },
)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
    return _token_for(user)


@router.get(
    "/me",
    response_model=UserRead,
    summary="Get the currently authenticated user",
    responses={401: {"description": "Not authenticated"}},
)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
