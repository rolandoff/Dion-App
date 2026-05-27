"""Tests for home feed endpoint — caching and content delivery."""
from __future__ import annotations

import json
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Child, ContextSnapshot
from app.schemas import HomeContent


def _make_home_content() -> dict:
    """Return a sample HomeContent dict for cache seeding."""
    return {
        "contextual_greeting": "Good morning.",
        "what_matters_headline": "Football tomorrow.",
        "what_matters_support": "He usually gets excited beforehand.",
        "promise_headline": None,
        "promise_support": None,
        "promise_soft_check": None,
        "reminder_headline": None,
        "reminder_support": None,
        "resurfacing_headline": None,
        "resurfacing_content": None,
        "reflection_cta": "Anything worth remembering today?",
        "generated_at": datetime.utcnow().isoformat(),
    }


@pytest.mark.asyncio
async def test_home_returns_cached(
    client: AsyncClient,
    auth_headers: dict,
    test_child: Child,
    session: AsyncSession,
) -> None:
    """Home endpoint returns cached content when snapshot is valid."""
    cached = _make_home_content()
    snapshot = ContextSnapshot(
        child_id=test_child.id,
        home_content=json.dumps(cached),
        valid_until=datetime.utcnow() + timedelta(hours=4),
    )
    session.add(snapshot)
    await session.commit()

    response = await client.get(f"/home/{test_child.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["contextual_greeting"] == "Good morning."
    assert data["what_matters_headline"] == "Football tomorrow."


@pytest.mark.asyncio
async def test_home_cache_miss_generates_content(
    client: AsyncClient,
    auth_headers: dict,
    test_child: Child,
    test_memories: list,
) -> None:
    """Home endpoint generates content when no valid cache exists."""
    with patch("app.routers.home.generate_home_content") as mock_gen:
        mock_gen.return_value = HomeContent(
            contextual_greeting="Evening.",
            what_matters_headline="Something matters.",
            what_matters_support="He usually seems calm.",
            reflection_cta="Worth remembering?",
            generated_at=datetime.utcnow(),
        )
        response = await client.get(f"/home/{test_child.id}", headers=auth_headers)

    assert response.status_code == 200
    mock_gen.assert_called_once()


@pytest.mark.asyncio
async def test_home_refresh_bypasses_cache(
    client: AsyncClient,
    auth_headers: dict,
    test_child: Child,
    session: AsyncSession,
) -> None:
    """Force refresh deletes cache and regenerates content."""
    snapshot = ContextSnapshot(
        child_id=test_child.id,
        home_content=json.dumps(_make_home_content()),
        valid_until=datetime.utcnow() + timedelta(hours=4),
    )
    session.add(snapshot)
    await session.commit()

    with patch("app.routers.home.generate_home_content") as mock_gen:
        mock_gen.return_value = HomeContent(
            contextual_greeting="Refreshed.",
            what_matters_headline="New content.",
            what_matters_support="Seems relevant lately.",
            reflection_cta="Anything today?",
            generated_at=datetime.utcnow(),
        )
        response = await client.post(
            f"/home/{test_child.id}/refresh",
            headers=auth_headers,
        )

    assert response.status_code == 200
    mock_gen.assert_called_once()


@pytest.mark.asyncio
async def test_home_expired_cache_regenerates(
    client: AsyncClient,
    auth_headers: dict,
    test_child: Child,
    session: AsyncSession,
) -> None:
    """An expired snapshot triggers fresh content generation."""
    expired_snapshot = ContextSnapshot(
        child_id=test_child.id,
        home_content=json.dumps(_make_home_content()),
        valid_until=datetime.utcnow() - timedelta(hours=1),  # expired
    )
    session.add(expired_snapshot)
    await session.commit()

    with patch("app.routers.home.generate_home_content") as mock_gen:
        mock_gen.return_value = HomeContent(
            contextual_greeting="Morning.",
            what_matters_headline="Fresh content.",
            what_matters_support="Something seems relevant.",
            reflection_cta="Anything today?",
            generated_at=datetime.utcnow(),
        )
        response = await client.get(f"/home/{test_child.id}", headers=auth_headers)

    assert response.status_code == 200
    mock_gen.assert_called_once()


@pytest.mark.asyncio
async def test_home_child_not_found(client: AsyncClient, auth_headers: dict) -> None:
    """Non-existent child returns 404."""
    response = await client.get("/home/bad-id", headers=auth_headers)
    assert response.status_code == 404
