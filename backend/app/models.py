"""SQLModel ORM models for Dion backend."""
from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class MemoryType(str, Enum):
    """The 8 memory types in Dion's taxonomy."""

    moment = "moment"
    interest = "interest"
    promise = "promise"
    quote = "quote"
    emotional_pattern = "emotional_pattern"
    milestone = "milestone"
    routine = "routine"
    relationship = "relationship"


class NotificationCategory(str, Enum):
    """Categories of Dion notifications — all presence-first."""

    promise = "promise"
    contextual = "contextual"
    resurfacing = "resurfacing"
    meaningful_moment = "meaningful_moment"
    reflection = "reflection"


# Weight constants — promises are highest priority
MEMORY_WEIGHTS: dict = {
    MemoryType.promise: 5,
    MemoryType.moment: 4,
    MemoryType.milestone: 4,
    MemoryType.interest: 3,
    MemoryType.quote: 3,
    MemoryType.emotional_pattern: 2,
    MemoryType.routine: 1,
    MemoryType.relationship: 1,
}


class User(SQLModel, table=True):
    """App user (the father)."""

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True
    )
    email: str = Field(unique=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Child(SQLModel, table=True):
    """A child profile — portrait of who they are right now."""

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True
    )
    user_id: str = Field(foreign_key="user.id", index=True)
    name: str
    age: int
    photo_url: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Memory(SQLModel, table=True):
    """A meaningful memory — the core product primitive."""

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True
    )
    child_id: str = Field(foreign_key="child.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    type: MemoryType
    content: str
    context: Optional[str] = Field(default=None)
    timing: Optional[str] = Field(default=None)
    # Weight 1-5: promise=5, moment/milestone=4, interest/quote=3, pattern=2, routine/relationship=1
    weight: int = Field(default=1)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ContextSnapshot(SQLModel, table=True):
    """Cached AI-generated home feed — avoids redundant Claude API calls."""

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True
    )
    child_id: str = Field(foreign_key="child.id", unique=True, index=True)
    home_content: str  # JSON string of HomeContent schema
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    valid_until: datetime  # 4 hours from generation


class PushToken(SQLModel, table=True):
    """Expo push notification token per user."""

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True
    )
    user_id: str = Field(foreign_key="user.id", unique=True)
    expo_token: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Notification(SQLModel, table=True):
    """Scheduled notification — presence-first, low frequency."""

    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True
    )
    user_id: str = Field(foreign_key="user.id", index=True)
    child_id: str = Field(foreign_key="child.id")
    memory_id: Optional[str] = Field(
        foreign_key="memory.id", default=None
    )
    category: NotificationCategory
    title: str
    body: str
    scheduled_at: datetime
    sent_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
