"""Authentication endpoints — register, login, me."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_session
from app.models import User
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, session: AsyncSession = Depends(get_session)) -> TokenResponse:
    """
    Register a new user.

    Args:
        payload: Email and password.
        session: Database session.

    Returns:
        JWT access token.
    """
    existing = await session.exec(select(User).where(User.email == payload.email))
    if existing.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    session.add(user)
    await session.commit()
    await session.refresh(user)
    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_session)) -> TokenResponse:
    """
    Authenticate existing user.

    Args:
        payload: Email and password.
        session: Database session.

    Returns:
        JWT access token.
    """
    result = await session.exec(select(User).where(User.email == payload.email))
    user = result.first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token({"sub": user.id})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """
    Return the currently authenticated user.

    Args:
        current_user: Injected via JWT dependency.

    Returns:
        User profile.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        created_at=current_user.created_at,
    )
