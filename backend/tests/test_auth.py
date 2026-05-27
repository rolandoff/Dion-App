"""Tests for authentication endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient) -> None:
    """New user registration returns a JWT token."""
    response = await client.post(
        "/auth/register",
        json={"email": "new@dion.app", "password": "securepass123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 20


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient) -> None:
    """Registering with an existing email returns 409."""
    payload = {"email": "dup@dion.app", "password": "pass123"}
    await client.post("/auth/register", json=payload)
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_returns_token(client: AsyncClient) -> None:
    """Valid credentials return a JWT token."""
    await client.post(
        "/auth/register",
        json={"email": "login@dion.app", "password": "mypassword"},
    )
    response = await client.post(
        "/auth/login",
        json={"email": "login@dion.app", "password": "mypassword"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient) -> None:
    """Wrong password returns 401."""
    await client.post(
        "/auth/register",
        json={"email": "wrong@dion.app", "password": "correctpass"},
    )
    response = await client.post(
        "/auth/login",
        json={"email": "wrong@dion.app", "password": "wrongpass"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_returns_user(client: AsyncClient) -> None:
    """Authenticated /auth/me returns user info."""
    reg = await client.post(
        "/auth/register",
        json={"email": "me@dion.app", "password": "pass123"},
    )
    token = reg.json()["access_token"]
    response = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@dion.app"


@pytest.mark.asyncio
async def test_me_invalid_token(client: AsyncClient) -> None:
    """Invalid token returns 401."""
    response = await client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalidtoken"},
    )
    assert response.status_code == 401
