from uuid import UUID, uuid4

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from services.notification.application.dtos import (
    CreateNotificationRequest,
    InboxSummary,
    NotificationResponse,
)
from services.notification.application.ws_manager import manager
from services.notification.infrastructure.models import NotificationModel


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, request: CreateNotificationRequest) -> NotificationResponse:
        n = NotificationModel(
            id=uuid4(),
            user_id=request.user_id,
            type=request.type,
            title=request.title,
            body=request.body,
        )
        self.db.add(n)
        await self.db.commit()
        await self.db.refresh(n)
        response = self._to_response(n)
        await manager.send_to_user(
            request.user_id,
            {"type": "notification", "data": response.model_dump(mode="json")},
        )
        return response

    async def inbox(self, user_id: UUID, limit: int = 50) -> InboxSummary:
        notifications = await self.list_for_user(user_id, limit=limit)
        unread = await self.unread_count(user_id)
        return InboxSummary(unread_count=unread, notifications=notifications)

    async def list_for_user(self, user_id: UUID, limit: int = 50) -> list[NotificationResponse]:
        result = await self.db.execute(
            select(NotificationModel)
            .where(NotificationModel.user_id == user_id)
            .order_by(NotificationModel.created_at.desc())
            .limit(limit)
        )
        return [self._to_response(n) for n in result.scalars().all()]

    async def mark_read(self, user_id: UUID, notification_id: UUID) -> NotificationResponse:
        result = await self.db.execute(
            select(NotificationModel).where(
                NotificationModel.id == notification_id,
                NotificationModel.user_id == user_id,
            )
        )
        n = result.scalar_one_or_none()
        if not n:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Notification not found")
        n.read = True
        await self.db.commit()
        await self.db.refresh(n)
        return self._to_response(n)

    async def mark_all_read(self, user_id: UUID) -> int:
        result = await self.db.execute(
            update(NotificationModel)
            .where(NotificationModel.user_id == user_id, NotificationModel.read == False)  # noqa: E712
            .values(read=True)
        )
        await self.db.commit()
        return result.rowcount or 0

    async def unread_count(self, user_id: UUID) -> int:
        result = await self.db.execute(
            select(NotificationModel).where(
                NotificationModel.user_id == user_id,
                NotificationModel.read == False,  # noqa: E712
            )
        )
        return len(result.scalars().all())

    def _to_response(self, n: NotificationModel) -> NotificationResponse:
        return NotificationResponse(
            id=n.id,
            user_id=n.user_id,
            type=n.type,
            title=n.title,
            body=n.body,
            read=n.read,
            created_at=n.created_at,
        )