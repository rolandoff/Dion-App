"""Pydantic request/response schemas for Dion API."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models import MemoryType, NotificationCategory


# ── Auth ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    """User registration payload."""

    email: str
    password: str


class LoginRequest(BaseModel):
    """User login payload."""

    email: str
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Public user representation."""

    id: str
    email: str
    created_at: datetime


# ── Children ─────────────────────────────────────────────────────────────────

class ChildCreate(BaseModel):
    """Create a new child profile."""

    name: str
    age: int
    photo_url: Optional[str] = None


class ChildUpdate(BaseModel):
    """Partial update for a child profile."""

    name: Optional[str] = None
    age: Optional[int] = None
    photo_url: Optional[str] = None


class ChildResponse(BaseModel):
    """Child profile response."""

    id: str
    user_id: str
    name: str
    age: int
    photo_url: Optional[str]
    created_at: datetime


# ── Memories ─────────────────────────────────────────────────────────────────

class MemoryCreate(BaseModel):
    """Create a new memory."""

    child_id: str
    type: MemoryType
    content: str
    context: Optional[str] = None
    timing: Optional[str] = None


class MemoryUpdate(BaseModel):
    """Partial update for a memory."""

    content: Optional[str] = None
    context: Optional[str] = None
    timing: Optional[str] = None
    is_active: Optional[bool] = None


class MemoryResponse(BaseModel):
    """Memory response."""

    id: str
    child_id: str
    user_id: str
    type: MemoryType
    content: str
    context: Optional[str]
    timing: Optional[str]
    weight: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ── Home Feed ─────────────────────────────────────────────────────────────────

class HomeContent(BaseModel):
    """AI-generated home feed — strict Dion tone, never productivity."""

    contextual_greeting: str
    what_matters_headline: str
    what_matters_support: str
    promise_headline: Optional[str] = None
    promise_support: Optional[str] = None
    promise_soft_check: Optional[str] = None
    reminder_headline: Optional[str] = None
    reminder_support: Optional[str] = None
    resurfacing_headline: Optional[str] = None
    resurfacing_content: Optional[str] = None
    reflection_cta: str
    generated_at: datetime


# ── Notifications ─────────────────────────────────────────────────────────────

class PushTokenRequest(BaseModel):
    """Register Expo push token."""

    expo_token: str


class NotificationResponse(BaseModel):
    """Notification history entry."""

    id: str
    category: NotificationCategory
    title: str
    body: str
    scheduled_at: datetime
    sent_at: Optional[datetime]
    created_at: datetime
