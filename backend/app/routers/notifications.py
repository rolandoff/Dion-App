"""Notifications endpoints — register push tokens, view history."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import desc
from sqlmodel import select

from app.auth import get_current_user
from app.database import get_session
from app.models import Notification, PushToken, User
from app.schemas import NotificationResponse, PushTokenRequest

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/token", status_code=status.HTTP_200_OK)
async def register_push_token(
    payload: PushTokenRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """
    Register or update the Expo push token for the current user.

    Args:
        payload: Expo push token string.
        current_user: Authenticated user.
        session: Database session.

    Returns:
        Success confirmation.
    """
    result = await session.exec(
        select(PushToken).where(PushToken.user_id == current_user.id)
    )
    existing = result.first()

    if existing:
        existing.expo_token = payload.expo_token
        session.add(existing)
    else:
        token = PushToken(user_id=current_user.id, expo_token=payload.expo_token)
        session.add(token)

    await session.commit()
    return {"status": "ok"}


@router.get("/history", response_model=List[NotificationResponse])
async def notification_history(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[NotificationResponse]:
    """
    Get sent notifications history for the current user.

    Args:
        current_user: Authenticated user.
        session: Database session.

    Returns:
        List of past notifications.
    """
    result = await session.exec(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(desc(Notification.scheduled_at))
    )
    notifications = result.all()
    return [NotificationResponse(**n.model_dump()) for n in notifications]
