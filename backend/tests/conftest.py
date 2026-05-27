"""Shared test fixtures for Dion backend tests."""
from __future__ import annotations

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.main import app
from app.models import Child, Memory, MemoryType, User
from app.auth import hash_password, create_access_token

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create an in-memory SQLite engine per test function."""
    engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def session(test_engine):
    """Provide a test database session."""
    factory = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as sess:
        yield sess


@pytest_asyncio.fixture(scope="function")
async def client(test_engine):
    """Provide an async test client with the test database."""
    factory = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_session():
        async with factory() as sess:
            yield sess

    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(session: AsyncSession) -> User:
    """Create and return a test user."""
    user = User(email="test@dion.app", hashed_password=hash_password("testpass123"))
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict:
    """Return auth headers for the test user."""
    token = create_access_token({"sub": test_user.id})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def test_child(session: AsyncSession, test_user: User) -> Child:
    """Create and return a test child."""
    child = Child(user_id=test_user.id, name="Lucas", age=7)
    session.add(child)
    await session.commit()
    await session.refresh(child)
    return child


@pytest_asyncio.fixture
async def test_memories(session: AsyncSession, test_user: User, test_child: Child):
    """Create a set of test memories covering different types."""
    memories = [
        Memory(
            child_id=test_child.id,
            user_id=test_user.id,
            type=MemoryType.promise,
            content="Park this weekend",
            context="He has been excited about it all week",
            weight=5,
        ),
        Memory(
            child_id=test_child.id,
            user_id=test_user.id,
            type=MemoryType.interest,
            content="Obsessed with football lately",
            weight=3,
        ),
        Memory(
            child_id=test_child.id,
            user_id=test_user.id,
            type=MemoryType.quote,
            content="Dad, dinosaurs are forever.",
            weight=3,
        ),
        Memory(
            child_id=test_child.id,
            user_id=test_user.id,
            type=MemoryType.moment,
            content="He laughed for ten minutes because the dog sneezed",
            weight=4,
        ),
    ]
    for m in memories:
        session.add(m)
    await session.commit()
    for m in memories:
        await session.refresh(m)
    return memories
