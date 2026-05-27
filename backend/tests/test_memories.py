"""Tests for memory endpoints — including critical weight and cache tests."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.models import Child, ContextSnapshot, MemoryType


@pytest.mark.asyncio
async def test_create_moment_memory(
    client: AsyncClient, auth_headers: dict, test_child: Child
) -> None:
    """Creating a moment memory returns correct type and auto-weight 4."""
    response = await client.post(
        "/memories",
        json={
            "child_id": test_child.id,
            "type": "moment",
            "content": "He laughed about the dog sneezing",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "moment"
    assert data["weight"] == 4  # moment auto-weight
    assert data["content"] == "He laughed about the dog sneezing"


@pytest.mark.asyncio
async def test_create_promise_auto_weight_5(
    client: AsyncClient, auth_headers: dict, test_child: Child
) -> None:
    """Promises MUST auto-assign weight 5 — highest priority."""
    response = await client.post(
        "/memories",
        json={
            "child_id": test_child.id,
            "type": "promise",
            "content": "Park this weekend",
            "context": "He has been excited all week",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["weight"] == 5, "Promises must have weight 5 — highest priority in Dion"
    assert data["type"] == "promise"


@pytest.mark.asyncio
async def test_interest_auto_weight_3(
    client: AsyncClient, auth_headers: dict, test_child: Child
) -> None:
    """Interest memories get auto-weight 3."""
    response = await client.post(
        "/memories",
        json={"child_id": test_child.id, "type": "interest", "content": "Football lately"},
        headers=auth_headers,
    )
    assert response.json()["weight"] == 3


@pytest.mark.asyncio
async def test_list_memories(
    client: AsyncClient, auth_headers: dict, test_child: Child, test_memories: list
) -> None:
    """Listing memories returns all memories for the child."""
    response = await client.get(
        f"/children/{test_child.id}/memories",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert len(response.json()) == 4


@pytest.mark.asyncio
async def test_list_memories_by_type(
    client: AsyncClient, auth_headers: dict, test_child: Child, test_memories: list
) -> None:
    """Filtering memories by type returns only that type."""
    response = await client.get(
        f"/children/{test_child.id}/memories?type=promise",
        headers=auth_headers,
    )
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 1
    assert items[0]["type"] == "promise"


@pytest.mark.asyncio
async def test_get_memory_detail(
    client: AsyncClient, auth_headers: dict, test_child: Child, test_memories: list
) -> None:
    """Getting a memory by ID returns the correct memory."""
    promise = next(m for m in test_memories if m.type == MemoryType.promise)
    response = await client.get(f"/memories/{promise.id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["content"] == "Park this weekend"


@pytest.mark.asyncio
async def test_memory_not_found(
    client: AsyncClient, auth_headers: dict
) -> None:
    """Non-existent memory returns 404."""
    response = await client.get("/memories/bad-id", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_cache_invalidated_on_new_memory(
    client: AsyncClient,
    auth_headers: dict,
    test_child: Child,
    session: AsyncSession,
) -> None:
    """Creating a new memory must delete the context snapshot."""
    # Manually create a snapshot
    snapshot = ContextSnapshot(
        child_id=test_child.id,
        home_content='{"contextual_greeting":"test"}',
        valid_until=__import__("datetime").datetime.utcnow()
        + __import__("datetime").timedelta(hours=4),
    )
    session.add(snapshot)
    await session.commit()

    # Create a memory — should invalidate the snapshot
    await client.post(
        "/memories",
        json={"child_id": test_child.id, "type": "moment", "content": "Dog sneeze"},
        headers=auth_headers,
    )

    # Snapshot should be gone
    result = await session.exec(
        select(ContextSnapshot).where(ContextSnapshot.child_id == test_child.id)
    )
    assert result.first() is None, "Context snapshot must be invalidated after new memory"
