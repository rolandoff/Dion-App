"""Children endpoints — create, read, update child profiles."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.auth import get_current_user
from app.database import get_session
from app.models import Child, User
from app.schemas import ChildCreate, ChildResponse, ChildUpdate

router = APIRouter(prefix="/children", tags=["children"])


@router.get("", response_model=List[ChildResponse])
async def list_children(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[ChildResponse]:
    """
    List all children for the current user.

    Args:
        current_user: Authenticated user.
        session: Database session.

    Returns:
        List of child profiles.
    """
    result = await session.exec(
        select(Child).where(Child.user_id == current_user.id)
    )
    children = result.all()
    return [ChildResponse(**c.model_dump()) for c in children]


@router.post("", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
async def create_child(
    payload: ChildCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ChildResponse:
    """
    Create a new child profile.

    Args:
        payload: Child name, age, optional photo.
        current_user: Authenticated user.
        session: Database session.

    Returns:
        Created child profile.
    """
    child = Child(user_id=current_user.id, **payload.model_dump())
    session.add(child)
    await session.commit()
    await session.refresh(child)
    return ChildResponse(**child.model_dump())


@router.get("/{child_id}", response_model=ChildResponse)
async def get_child(
    child_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ChildResponse:
    """
    Get a single child profile.

    Args:
        child_id: Child UUID.
        current_user: Authenticated user.
        session: Database session.

    Returns:
        Child profile.
    """
    result = await session.exec(
        select(Child).where(Child.id == child_id, Child.user_id == current_user.id)
    )
    child = result.first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return ChildResponse(**child.model_dump())


@router.patch("/{child_id}", response_model=ChildResponse)
async def update_child(
    child_id: str,
    payload: ChildUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ChildResponse:
    """
    Partially update a child profile.

    Args:
        child_id: Child UUID.
        payload: Fields to update.
        current_user: Authenticated user.
        session: Database session.

    Returns:
        Updated child profile.
    """
    result = await session.exec(
        select(Child).where(Child.id == child_id, Child.user_id == current_user.id)
    )
    child = result.first()
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(child, key, value)

    session.add(child)
    await session.commit()
    await session.refresh(child)
    return ChildResponse(**child.model_dump())
