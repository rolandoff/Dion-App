"""Memory endpoints — create and retrieve meaningful memories."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import desc, delete
from sqlmodel import select

from app.auth import get_current_user
from app.database import get_session
from app.models import Child, ContextSnapshot, Memory, MemoryType, MEMORY_WEIGHTS, User
from app.schemas import MemoryCreate, MemoryResponse, MemoryUpdate

router = APIRouter(tags=["memories"])


async def _invalidate_context_snapshot(child_id: str, session: AsyncSession) -> None:
    """Delete the context snapshot so the next home fetch regenerates via Claude."""
    await session.exec(
        delete(ContextSnapshot).where(ContextSnapshot.child_id == child_id)
    )
    await session.commit()


@router.post("/memories", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
async def create_memory(
    payload: MemoryCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MemoryResponse:
    """
    Create a new memory for a child.

    Weight is auto-assigned based on memory type.
    Context snapshot is invalidated so the home feed regenerates.

    Args:
        payload: Memory type, content, optional context and timing.
        current_user: Authenticated user.
        session: Database session.

    Returns:
        Created memory.
    """
    child_result = await session.exec(
        select(Child).where(
            Child.id == payload.child_id, Child.user_id == current_user.id
        )
    )
    if not child_result.first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    weight = MEMORY_WEIGHTS.get(payload.type, 1)
    memory = Memory(
        user_id=current_user.id,
        weight=weight,
        **payload.model_dump(),
    )
    session.add(memory)
    await session.commit()
    await session.refresh(memory)

    await _invalidate_context_snapshot(payload.child_id, session)

    return MemoryResponse(**memory.model_dump())


@router.get("/memories/{memory_id}", response_model=MemoryResponse)
async def get_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MemoryResponse:
    """
    Get a single memory by ID.

    Args:
        memory_id: Memory UUID.
        current_user: Authenticated user.
        session: Database session.

    Returns:
        Memory detail.
    """
    result = await session.exec(
        select(Memory).where(
            Memory.id == memory_id, Memory.user_id == current_user.id
        )
    )
    memory = result.first()
    if not memory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")
    return MemoryResponse(**memory.model_dump())


@router.get("/children/{child_id}/memories", response_model=List[MemoryResponse])
async def list_memories(
    child_id: str,
    type: Optional[MemoryType] = Query(default=None),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> List[MemoryResponse]:
    """
    List memories for a child, optionally filtered by type.

    Args:
        child_id: Child UUID.
        type: Optional filter by memory type.
        current_user: Authenticated user.
        session: Database session.

    Returns:
        List of memories ordered by creation date descending.
    """
    query = select(Memory).where(
        Memory.child_id == child_id, Memory.user_id == current_user.id
    )
    if type is not None:
        query = query.where(Memory.type == type)
    query = query.order_by(desc(Memory.created_at))

    result = await session.exec(query)
    memories = result.all()
    return [MemoryResponse(**m.model_dump()) for m in memories]


@router.patch("/memories/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    payload: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MemoryResponse:
    """
    Partially update a memory.

    Args:
        memory_id: Memory UUID.
        payload: Fields to update.
        current_user: Authenticated user.
        session: Database session.

    Returns:
        Updated memory.
    """
    result = await session.exec(
        select(Memory).where(
            Memory.id == memory_id, Memory.user_id == current_user.id
        )
    )
    memory = result.first()
    if not memory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(memory, key, value)
    memory.updated_at = datetime.utcnow()

    session.add(memory)
    await session.commit()
    await session.refresh(memory)

    await _invalidate_context_snapshot(memory.child_id, session)
    return MemoryResponse(**memory.model_dump())
