"""Tests for children endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models import Child


@pytest.mark.asyncio
async def test_create_child(client: AsyncClient, auth_headers: dict) -> None:
    """Creating a child returns the new profile."""
    response = await client.post(
        "/children",
        json={"name": "Sofia", "age": 5},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Sofia"
    assert data["age"] == 5
    assert "id" in data


@pytest.mark.asyncio
async def test_list_children(client: AsyncClient, auth_headers: dict, test_child: Child) -> None:
    """Listing children returns the user's profiles."""
    response = await client.get("/children", headers=auth_headers)
    assert response.status_code == 200
    names = [c["name"] for c in response.json()]
    assert "Lucas" in names


@pytest.mark.asyncio
async def test_get_child(client: AsyncClient, auth_headers: dict, test_child: Child) -> None:
    """Getting a child by ID returns the correct profile."""
    response = await client.get(f"/children/{test_child.id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Lucas"


@pytest.mark.asyncio
async def test_get_child_not_found(client: AsyncClient, auth_headers: dict) -> None:
    """Non-existent child returns 404."""
    response = await client.get("/children/nonexistent-id", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_child_age(client: AsyncClient, auth_headers: dict, test_child: Child) -> None:
    """Patching a child updates the specified field."""
    response = await client.patch(
        f"/children/{test_child.id}",
        json={"age": 8},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["age"] == 8
    assert response.json()["name"] == "Lucas"
