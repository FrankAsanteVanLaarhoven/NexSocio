import asyncio
import json
import logging
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from services.notification.infrastructure.config import Settings
from services.notification.infrastructure.models import PushSubscriptionModel

logger = logging.getLogger(__name__)


def _send_web_push(
    subscription: PushSubscriptionModel,
    payload: dict,
    settings: Settings,
) -> bool:
    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        return False

    try:
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
            },
            data=json.dumps(payload),
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": settings.vapid_claims_email},
        )
        return True
    except WebPushException as exc:
        if exc.response and exc.response.status_code in (404, 410):
            return False
        logger.warning("Web push failed: %s", exc)
        return False


async def send_push_to_user(
    db: AsyncSession,
    settings: Settings,
    user_id: UUID,
    title: str,
    body: str,
    url: str = "/inbox",
) -> int:
    if not settings.web_push_enabled or not settings.vapid_private_key:
        return 0

    result = await db.execute(
        select(PushSubscriptionModel).where(PushSubscriptionModel.user_id == user_id)
    )
    subs = result.scalars().all()
    if not subs:
        return 0

    payload = {"title": title, "body": body, "url": url}
    sent = 0
    stale_endpoints: list[str] = []

    for sub in subs:
        ok = await asyncio.to_thread(_send_web_push, sub, payload, settings)
        if ok:
            sent += 1
        else:
            stale_endpoints.append(sub.endpoint)

    if stale_endpoints:
        await db.execute(
            delete(PushSubscriptionModel).where(
                PushSubscriptionModel.endpoint.in_(stale_endpoints)
            )
        )
        await db.commit()

    return sent