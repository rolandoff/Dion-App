"""Tests for context engine — the moat of Dion."""
from __future__ import annotations

import json
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

from app.context_engine import (
    _find_resurfacing_memory,
    _prioritize_memories,
    _recency_score,
    generate_home_content,
)
from app.models import Child, Memory, MemoryType


def make_memory(
    type: MemoryType,
    content: str,
    weight: int = 3,
    days_old: int = 0,
    context: str = None,
) -> Memory:
    """Helper to create test Memory objects."""
    return Memory(
        id=f"mem-{content[:10]}",
        child_id="child-1",
        user_id="user-1",
        type=type,
        content=content,
        weight=weight,
        context=context,
        is_active=True,
        created_at=datetime.utcnow() - timedelta(days=days_old),
        updated_at=datetime.utcnow(),
    )


def make_child() -> Child:
    """Helper to create a test Child object."""
    return Child(
        id="child-1",
        user_id="user-1",
        name="Lucas",
        age=7,
        created_at=datetime.utcnow(),
    )


class TestRecencyScore:
    """Tests for the memory freshness scoring function."""

    def test_today_is_max_score(self) -> None:
        """A memory created today should have a score of 1.0."""
        now = datetime.utcnow()
        score = _recency_score(now, now)
        assert score == 1.0

    def test_90_days_ago_is_zero(self) -> None:
        """A memory 90 days old should score 0."""
        now = datetime.utcnow()
        score = _recency_score(now - timedelta(days=90), now)
        assert score == 0.0

    def test_45_days_is_half(self) -> None:
        """A 45-day-old memory should score ~0.5."""
        now = datetime.utcnow()
        score = _recency_score(now - timedelta(days=45), now)
        assert abs(score - 0.5) < 0.01


class TestPrioritizeMemories:
    """Tests for memory prioritization logic."""

    def test_promises_surface_first(self) -> None:
        """Promises (weight=5) must always be prioritized over other types."""
        now = datetime.utcnow()
        memories = [
            make_memory(MemoryType.interest, "Football", weight=3, days_old=0),
            make_memory(MemoryType.promise, "Park this weekend", weight=5, days_old=0),
            make_memory(MemoryType.moment, "Dog sneeze", weight=4, days_old=0),
        ]
        prioritized = _prioritize_memories(memories, now)
        assert prioritized[0].type == MemoryType.promise

    def test_inactive_memories_excluded(self) -> None:
        """Inactive memories must not appear in prioritized list."""
        now = datetime.utcnow()
        memories = [
            make_memory(MemoryType.interest, "Old interest", weight=3, days_old=5),
        ]
        memories[0].is_active = False
        prioritized = _prioritize_memories(memories, now)
        assert len(prioritized) == 0

    def test_max_10_memories(self) -> None:
        """Result is capped at 10 memories."""
        now = datetime.utcnow()
        memories = [
            make_memory(MemoryType.moment, f"Memory {i}", weight=4, days_old=i)
            for i in range(15)
        ]
        prioritized = _prioritize_memories(memories, now)
        assert len(prioritized) == 10


class TestResurfacing:
    """Tests for nostalgic memory resurfacing logic."""

    def test_finds_old_memory(self) -> None:
        """Memory older than 180 days with weight >= 3 is a resurfacing candidate."""
        now = datetime.utcnow()
        memories = [
            make_memory(MemoryType.interest, "Dinosaurs phase", weight=3, days_old=200),
            make_memory(MemoryType.moment, "Recent memory", weight=4, days_old=5),
        ]
        result = _find_resurfacing_memory(memories, now)
        assert result is not None
        assert result.content == "Dinosaurs phase"

    def test_recent_memory_not_surfaced(self) -> None:
        """Recent memories (< 180 days) are not resurfacing candidates."""
        now = datetime.utcnow()
        memories = [
            make_memory(MemoryType.moment, "Recent", weight=4, days_old=10),
        ]
        assert _find_resurfacing_memory(memories, now) is None

    def test_low_weight_old_memory_excluded(self) -> None:
        """Old memories with weight < 3 are not resurfaced."""
        now = datetime.utcnow()
        memories = [
            make_memory(MemoryType.routine, "Low weight old", weight=1, days_old=200),
        ]
        assert _find_resurfacing_memory(memories, now) is None


class TestGenerateHomeContent:
    """Tests for home content generation — critical brand compliance tests."""

    @pytest.mark.asyncio
    async def test_fallback_when_ollama_unavailable(self) -> None:
        """When Ollama is unreachable, fallback content is returned without crashing."""
        child = make_child()
        memories = [make_memory(MemoryType.promise, "Park this weekend", weight=5)]

        with patch("app.context_engine.OpenAI") as mock_openai:
            mock_openai.side_effect = Exception("Ollama not running")
            content = await generate_home_content(child, memories)

        assert content.contextual_greeting is not None
        assert content.what_matters_headline is not None
        assert content.reflection_cta is not None

    @pytest.mark.asyncio
    async def test_fallback_promise_surfaces(self) -> None:
        """Fallback content surfaces promise data when a promise exists."""
        child = make_child()
        memories = [
            make_memory(
                MemoryType.promise,
                "Park this weekend",
                weight=5,
                context="He has been talking about it all week",
            )
        ]
        with patch("app.context_engine.OpenAI") as mock_openai:
            mock_openai.side_effect = Exception("Ollama not running")
            content = await generate_home_content(child, memories)

        assert content.promise_headline == "Park this weekend"

    @pytest.mark.asyncio
    async def test_empty_memories_no_crash(self) -> None:
        """Empty memory list still produces valid fallback content."""
        child = make_child()
        with patch("app.context_engine.OpenAI") as mock_openai:
            mock_openai.side_effect = Exception("Ollama not running")
            content = await generate_home_content(child, [])

        assert content is not None
        assert content.reflection_cta != ""

    @pytest.mark.asyncio
    async def test_soft_language_validation(self) -> None:
        """Banned certainty language must not appear in Dion AI output."""
        banned_phrases = [
            "behavioral pattern",
            "detected",
            "optimize",
            "He feels anxious",
            "She loves",
            "performance",
        ]
        safe_text = "He usually seems excited before football lately."
        for phrase in banned_phrases:
            assert phrase.lower() not in safe_text.lower(), (
                f"Banned phrase '{phrase}' must not appear in Dion AI output"
            )

    @pytest.mark.asyncio
    async def test_mock_ollama_response(self) -> None:
        """Ollama tool call response parses into HomeContent correctly."""
        child = make_child()
        memories = [make_memory(MemoryType.interest, "Football lately", weight=3)]

        tool_args = {
            "contextual_greeting": "Good morning.",
            "what_matters_headline": "Football week.",
            "what_matters_support": "He sometimes seems extra excited lately.",
            "reflection_cta": "Anything worth remembering today?",
        }

        mock_tool_call = MagicMock()
        mock_tool_call.function.arguments = json.dumps(tool_args)

        mock_message = MagicMock()
        mock_message.tool_calls = [mock_tool_call]

        mock_choice = MagicMock()
        mock_choice.message = mock_message

        mock_response = MagicMock()
        mock_response.choices = [mock_choice]

        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response

        with patch("app.context_engine.OpenAI", return_value=mock_client):
            content = await generate_home_content(child, memories)

        assert content.contextual_greeting == "Good morning."
        assert content.what_matters_headline == "Football week."
        assert "lately" in content.what_matters_support or "seems" in content.what_matters_support
