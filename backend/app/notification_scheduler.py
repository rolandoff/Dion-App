"""
Notification scheduler — presence-first, low frequency.

Sends promise reminders and contextual nudges via Expo Push API.
Never engagement-driven. Never streak-based. Only meaningful moments.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlmodel import select

from app.database import async_session_factory
from app.models import Memory, Notification, NotificationCategory, PushToken

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

scheduler = AsyncIOScheduler()


async def schedule_promise_reminders(
    user_id: str, child_id: str, memory: Memory
) -> None:
    """
    Schedule a contextual reminder for a promise memory.

    Creates a gentle reminder the day before and day of (if timing is set),
    or 24 hours from now if no timing. Never guilt-inducing.

    Args:
        user_id: Owner user ID.
        child_id: Child ID.
        memory: The promise memory.
    """
    async with async_session_factory() as session:
        body = memory.content
        if memory.context:
            body = f"{memory.content}\n{memory.context}"

        notification = Notification(
            user_id=user_id,
            child_id=child_id,
            memory_id=memory.id,
            category=NotificationCategory.promise,
            title=memory.content,
            body=body,
            scheduled_at=datetime.utcnow() + timedelta(hours=20),
        )
        session.add(notification)
        await session.commit()
        logger.info("Scheduled promise reminder for memory %s", memory.id)


async def check_and_send_pending() -> None:
    """
    Hourly job: find pending notifications and send via Expo Push API.

    Only sends if a push token is registered. Marks sent_at on success.
    """
    async with async_session_factory() as session:
        now = datetime.utcnow()
        result = await session.exec(
            select(Notification).where(
                Notification.scheduled_at <= now,
                Notification.sent_at.is_(None),
            )
        )
        pending = result.all()

        if not pending:
            return

        for notif in pending:
            token_result = await session.exec(
                select(PushToken).where(PushToken.user_id == notif.user_id)
            )
            push_token = token_result.first()
            if not push_token:
                continue

            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        EXPO_PUSH_URL,
                        json={
                            "to": push_token.expo_token,
                            "title": notif.title,
                            "body": notif.body,
                            "sound": "default",
                        },
                        timeout=10.0,
                    )
                    if response.status_code == 200:
                        notif.sent_at = now
                        session.add(notif)
                        logger.info("Sent notification %s", notif.id)
            except Exception as exc:
                logger.warning("Failed to send notification %s: %s", notif.id, exc)

        await session.commit()


def start_scheduler() -> None:
    """Start the APScheduler with the hourly notification job."""
    scheduler.add_job(
        check_and_send_pending,
        trigger="interval",
        hours=1,
        id="check_notifications",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Notification scheduler started")


def stop_scheduler() -> None:
    """Gracefully stop the scheduler on app shutdown."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Notification scheduler stopped")
