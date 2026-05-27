"""Home feed endpoints — AI-powered contextual content with caching."""
from __future__ import annotations

import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import delete
from sqlmodel import select

from app.auth import get_current_user
from app.context_engine import generate_home_content
from app.database import get_session
from app.models import Child, ContextSnapshot, Memory, User
from app.schemas import HomeContent

router = APIRouter(prefix="/home", tags=["home"])

CACHE_TTL_HOURS = 4


async def _get_cached_content(child_id: str, session: AsyncSession) -> HomeContent | None:
    """
    Return valid cached home content, or None if expired/missing.

    Args:
        child_id: Child UUID.
        session: Database session.

    Returns:
        HomeContent if cache is valid, else None.
    """
    result = await session.exec(
        select(ContextSnapshot).where(ContextSnapshot.child_id == child_id)
    )
    snapshot = result.first()
    if snapshot and snapshot.valid_until > datetime.utcnow():
        return HomeContent(**json.loads(snapshot.home_content))
    return None


async def _save_snapshot(child_id: str, content: HomeContent, session: AsyncSession) -> None:
    """
    Upsert a context snapshot for this child.

    Args:
        child_id: Child UUID.
        content: Generated home content.
        session: Database session.
    """
    await session.exec(
        delete(ContextSnapshot).where(ContextSnapshot.child_id == child_id)
    )
    snapshot = ContextSnapshot(
        child_id=child_id,
        home_content=content.model_dump_json(),
        valid_until=datetime.utcnow() + timedelta(hours=CACHE_TTL_HOURS),
    )
    session.add(snapshot)
    await session.commit()


@router.get("/{child_id}", response_model=HomeContent)
async def get_home(
    child_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> HomeContent:
    """
    Get contextual home feed for a child.

    Returns cached content if valid (<4 hours old), otherwise generates
    fresh content via Claude API and caches it.

    Args:
        child_id: Child UUID.
        current_user: Authenticated user.
        session: Database session.

    Returns:
        HomeContent with Dion-tone contextual feed.
    """
    child_result = await session.exec(
        select(Child).where(Child.id == child_id, Child.user_id == current_user.id)
    )
    child = child_result.first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    cached = await _get_cached_content(child_id, session)
    if cached:
        return cached

    memories_result = await session.exec(
        select(Memory).where(Memory.child_id == child_id, Memory.user_id == current_user.id)
    )
    memories = list(memories_result.all())

    content = await generate_home_content(child, memories)
    await _save_snapshot(child_id, content, session)
    return content


@router.post("/{child_id}/refresh", response_model=HomeContent)
async def refresh_home(
    child_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> HomeContent:
    """
    Force-regenerate the home feed, bypassing cache.

    Args:
        child_id: Child UUID.
        current_user: Authenticated user.
        session: Database session.

    Returns:
        Fresh HomeContent from Claude API.
    """
    child_result = await session.exec(
        select(Child).where(Child.id == child_id, Child.user_id == current_user.id)
    )
    child = child_result.first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    # Invalidate cache first
    await session.exec(
        delete(ContextSnapshot).where(ContextSnapshot.child_id == child_id)
    )
    await session.commit()

    memories_result = await session.exec(
        select(Memory).where(Memory.child_id == child_id, Memory.user_id == current_user.id)
    )
    memories = list(memories_result.all())

    content = await generate_home_content(child, memories)
    await _save_snapshot(child_id, content, session)
    return content
