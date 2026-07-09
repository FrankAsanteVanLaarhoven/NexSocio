from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    title: str
    body: str
    read: bool
    created_at: datetime


class CreateNotificationRequest(BaseModel):
    user_id: UUID
    type: str = Field(..., max_length=32)
    title: str = Field(..., max_length=256)
    body: str = Field(default="", max_length=2000)


class InboxSummary(BaseModel):
    unread_count: int
    notifications: list[NotificationResponse]


class VapidPublicKeyResponse(BaseModel):
    public_key: str


class PushSubscribeRequest(BaseModel):
    endpoint: str
    keys: dict[str, str] = Field(..., description="p256dh and auth keys")


class PushSubscribeResponse(BaseModel):
    subscribed: bool