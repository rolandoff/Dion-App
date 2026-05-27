"""
Context Engine — the real moat of Dion.

Transforms memories into contextual, human-feeling home feed content
using a local LLM via Ollama. Memory + Time + Behavior + Meaning = Context.
"""
from __future__ import annotations

import asyncio
import json
import random
from datetime import datetime
from typing import List, Optional

from openai import OpenAI

from app.models import Memory, MemoryType, Child
from app.schemas import HomeContent
from app.settings import settings

# ── Dion brand voice system prompt ────────────────────────────────────────────

DION_SYSTEM_PROMPT = """You are the quiet emotional intelligence of Dion, a calm memory companion for modern fathers.
Your purpose: help fathers remember what matters so they can stay present with their children.

CORE PHILOSOPHY:
- Memory → Reminder → Presence (never Calendar → Task → Productivity)
- You are a thoughtful companion, never a coach, therapist, or productivity assistant
- Silence is intelligence — only surface what genuinely helps presence

TONE: calm, warm, human, minimal, emotionally intelligent
NEVER: robotic, clinical, motivational, productivity-oriented, cheerleader-like

LANGUAGE RULES (CRITICAL — violating these breaks the product):
- ALWAYS use soft confidence: "seems", "lately", "usually", "might", "sometimes", "appears to"
- NEVER use certainty language: "He feels", "She loves", "He is always", "She always"
- Keep ALL text SHORT — 1-2 sentences max per field
- Sound like a thoughtful friend quietly remembering something important
- NOT like an AI system analyzing behavioral data

BANNED phrases (never use these):
- "behavioral pattern", "detected", "insight", "optimize", "track", "performance"
- "reminder created", "task", "productivity", "engagement", "retention"
- "You should", "You must", "Required", "Complete", "Done"

GOOD EXAMPLES:
- "Football tomorrow. He usually gets excited beforehand."
- "Park this weekend. He's been asking about it lately."
- "Still obsessed with dinosaurs lately. Maybe ask what kind today."
- "A year ago: He couldn't stop talking about dinosaurs."
- "Anything worth remembering today?"

BAD EXAMPLES:
- "Reminder: Football practice at 4PM. Behavior: High energy expected."
- "Promise pending: Park visit. Status: Unresolved."
- "Behavioral insight: Child shows dinosaur fixation."
- "You should engage with your child about their interests."

The emotional response users should feel: "Oh right, this matters." Never: "I have work to do."
"""

# ── Tool schema for structured output ─────────────────────────────────────────

HOME_CONTENT_TOOL = {
    "type": "function",
    "function": {
        "name": "generate_home_content",
        "description": "Generate the contextual home feed content for a Dion user. All text must follow the brand voice rules exactly.",
        "parameters": {
            "type": "object",
            "properties": {
                "contextual_greeting": {
                    "type": "string",
                    "description": "Short contextual greeting tied to what is happening now. E.g.: 'Good morning. Football week.' NEVER generic like 'Welcome back.'",
                },
                "what_matters_headline": {
                    "type": "string",
                    "description": "The most relevant thing right now, 1 short sentence. E.g.: 'Football tomorrow.'",
                },
                "what_matters_support": {
                    "type": "string",
                    "description": "One soft emotional context sentence using soft language. E.g.: 'He usually gets excited beforehand.'",
                },
                "promise_headline": {
                    "type": "string",
                    "description": "If there is an active promise, state it simply. E.g.: 'Park this weekend.' Omit if no promise.",
                },
                "promise_support": {
                    "type": "string",
                    "description": "Warm context for the promise. Omit if no promise.",
                },
                "promise_soft_check": {
                    "type": "string",
                    "description": "A gentle non-guilt check-in. E.g.: 'Still happening?' NEVER guilt-inducing. Omit if no promise.",
                },
                "reminder_headline": {
                    "type": "string",
                    "description": "Optional second contextual reminder. Omit if not needed.",
                },
                "reminder_support": {
                    "type": "string",
                    "description": "Soft emotional support for reminder. Omit if not needed.",
                },
                "resurfacing_headline": {
                    "type": "string",
                    "description": "Nostalgic framing for resurfaced memory. E.g.: 'A year ago:' Omit if no old memory.",
                },
                "resurfacing_content": {
                    "type": "string",
                    "description": "The warm resurfaced memory content. Omit if no old memory.",
                },
                "reflection_cta": {
                    "type": "string",
                    "description": "A gentle reflection prompt. E.g.: 'Anything worth remembering today?' Always include.",
                },
            },
            "required": [
                "contextual_greeting",
                "what_matters_headline",
                "what_matters_support",
                "reflection_cta",
            ],
        },
    },
}


# ── Helper functions ───────────────────────────────────────────────────────────

def _recency_score(created_at: datetime, now: datetime) -> float:
    """
    Calculate a freshness score that decays linearly over 90 days.

    Args:
        created_at: When the memory was created.
        now: Current datetime.

    Returns:
        Float 0.0–1.0, higher means more recent.
    """
    days_ago = (now - created_at).days
    return max(0.0, 1.0 - (days_ago / 90.0))


def _prioritize_memories(memories: List[Memory], now: datetime) -> List[Memory]:
    """
    Sort memories by weight × recency score, promises always first.

    Args:
        memories: All active memories for the child.
        now: Current datetime.

    Returns:
        Top 10 memories sorted by priority.
    """
    active = [m for m in memories if m.is_active]
    scored = sorted(
        active,
        key=lambda m: m.weight * _recency_score(m.created_at, now),
        reverse=True,
    )
    return scored[:10]


def _find_resurfacing_memory(memories: List[Memory], now: datetime) -> Optional[Memory]:
    """
    Find a candidate for nostalgic resurfacing (6+ months old, high weight).

    Args:
        memories: All memories for the child.
        now: Current datetime.

    Returns:
        A randomly selected old memory, or None.
    """
    old = [
        m for m in memories
        if (now - m.created_at).days > 180 and m.weight >= 3
    ]
    return random.choice(old) if old else None


def _build_prompt(child: Child, memories: List[Memory], now: datetime) -> str:
    """
    Build the user prompt containing child context and memories.

    Args:
        child: Child profile.
        memories: Prioritized memories.
        now: Current datetime.

    Returns:
        Formatted prompt string.
    """
    resurfacing = _find_resurfacing_memory(memories, now)
    prioritized = _prioritize_memories(memories, now)

    memories_text = "\n".join(
        f"- [{m.type.value}] {m.content}"
        + (f" (context: {m.context})" if m.context else "")
        + (f" (timing: {m.timing})" if m.timing else "")
        for m in prioritized
    )

    resurfacing_line = (
        f"\nResurfacing memory (from 6+ months ago, for nostalgia):\n- {resurfacing.content}"
        if resurfacing
        else ""
    )

    return f"""Child: {child.name}, {child.age} years old
Current time: {now.strftime("%A, %B %d, %Y at %I:%M %p")}

Recent memories ordered by importance (promises first):
{memories_text if memories_text else "No memories yet — use the empty state tone."}
{resurfacing_line}

Generate the home feed content following all language rules in your system prompt.
Keep it calm, warm, and minimal. Never productivity-oriented."""


# ── Main generation function ───────────────────────────────────────────────────

async def generate_home_content(
    child: Child,
    memories: List[Memory],
    current_time: Optional[datetime] = None,
) -> HomeContent:
    """
    Generate AI-powered home feed content using a local Ollama model.

    Uses tool_use structured output for reliable JSON parsing.
    Falls back to a warm static response if Ollama is unavailable.

    Args:
        child: Child profile for context.
        memories: All memories for the child.
        current_time: Override current time (useful for testing).

    Returns:
        HomeContent with Dion-tone contextual content.
    """
    now = current_time or datetime.utcnow()

    try:
        client = OpenAI(
            base_url=settings.OLLAMA_URL,
            api_key="ollama",
        )
        prompt = _build_prompt(child, memories, now)

        def _call_ollama():
            return client.chat.completions.create(  # type: ignore[call-overload]
                model=settings.OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": DION_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                tools=[HOME_CONTENT_TOOL],
                tool_choice={"type": "function", "function": {"name": "generate_home_content"}},
            )

        response = await asyncio.to_thread(_call_ollama)
        tool_calls = response.choices[0].message.tool_calls
        if not tool_calls:
            return _fallback_home_content(child, memories, now)

        data = json.loads(tool_calls[0].function.arguments)
        return HomeContent(
            contextual_greeting=data.get("contextual_greeting") or "Good morning.",
            what_matters_headline=data.get("what_matters_headline") or "Something worth remembering.",
            what_matters_support=data.get("what_matters_support") or "Take a moment to be present.",
            promise_headline=data.get("promise_headline") or None,
            promise_support=data.get("promise_support") or None,
            promise_soft_check=data.get("promise_soft_check") or None,
            reminder_headline=data.get("reminder_headline") or None,
            reminder_support=data.get("reminder_support") or None,
            resurfacing_headline=data.get("resurfacing_headline") or None,
            resurfacing_content=data.get("resurfacing_content") or None,
            reflection_cta=data.get("reflection_cta") or "Anything worth remembering today?",
            generated_at=now,
        )

    except Exception:
        return _fallback_home_content(child, memories, now)


def _fallback_home_content(
    child: Child, memories: List[Memory], now: datetime
) -> HomeContent:
    """
    Warm fallback content when Ollama is unavailable.

    Builds content from actual memories without AI, maintaining Dion tone.

    Args:
        child: Child profile.
        memories: All memories.
        now: Current datetime.

    Returns:
        HomeContent with human-written fallback content.
    """
    prioritized = _prioritize_memories(memories, now)
    promise = next((m for m in prioritized if m.type == MemoryType.promise), None)
    top = next((m for m in prioritized if m.type != MemoryType.promise), None)
    resurfacing = _find_resurfacing_memory(memories, now)

    greeting = "Good morning."
    headline = top.content if top else f"Start remembering what matters about {child.name}."
    support = top.context if (top and top.context) else "Take a moment to be present."

    return HomeContent(
        contextual_greeting=greeting,
        what_matters_headline=headline,
        what_matters_support=support,
        promise_headline=promise.content if promise else None,
        promise_support=promise.context if (promise and promise.context) else None,
        promise_soft_check="Still happening?" if promise else None,
        resurfacing_headline="A little while ago:" if resurfacing else None,
        resurfacing_content=resurfacing.content if resurfacing else None,
        reflection_cta="Anything worth remembering today?",
        generated_at=now,
    )
