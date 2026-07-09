from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from nexus_common.domain.models import ApiResponse, HealthResponse
from nexus_common.security.jwt import decode_access_token

from services.notification.api.deps import (
    get_current_user_id,
    get_notification_service,
    get_settings,
    require_user_id,
)
from services.notification.application.dtos import (
    CreateNotificationRequest,
    InboxSummary,
    NotificationResponse,
    PushSubscribeRequest,
    PushSubscribeResponse,
    VapidPublicKeyResponse,
)
from services.notification.application.services import NotificationService
from services.notification.application.ws_manager import manager
from services.notification.infrastructure.config import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(service=settings.service_name)


@router.post("/notifications", response_model=ApiResponse[NotificationResponse])
async def create_notification(
    request: CreateNotificationRequest,
    service: Annotated[NotificationService, Depends(get_notification_service)],
) -> ApiResponse[NotificationResponse]:
    return ApiResponse(data=await service.create(request))


@router.get("/inbox", response_model=ApiResponse[InboxSummary])
async def inbox(
    user_id: Annotated[UUID, Depends(require_user_id)],
    service: Annotated[NotificationService, Depends(get_notification_service)],
) -> ApiResponse[InboxSummary]:
    return ApiResponse(data=await service.inbox(user_id))


@router.post("/notifications/{notification_id}/read", response_model=ApiResponse[NotificationResponse])
async def mark_read(
    notification_id: UUID,
    user_id: Annotated[UUID, Depends(require_user_id)],
    service: Annotated[NotificationService, Depends(get_notification_service)],
) -> ApiResponse[NotificationResponse]:
    return ApiResponse(data=await service.mark_read(user_id, notification_id))


@router.get("/push/vapid-public-key", response_model=ApiResponse[VapidPublicKeyResponse])
async def vapid_public_key(
    settings: Annotated[Settings, Depends(get_settings)],
) -> ApiResponse[VapidPublicKeyResponse]:
    return ApiResponse(data=VapidPublicKeyResponse(public_key=settings.vapid_public_key))


@router.post("/push/subscribe", response_model=ApiResponse[PushSubscribeResponse])
async def push_subscribe(
    request: PushSubscribeRequest,
    user_id: Annotated[UUID, Depends(require_user_id)],
    service: Annotated[NotificationService, Depends(get_notification_service)],
) -> ApiResponse[PushSubscribeResponse]:
    await service.subscribe_push(user_id, request)
    return ApiResponse(data=PushSubscribeResponse(subscribed=True))


@router.delete("/push/subscribe", response_model=ApiResponse[PushSubscribeResponse])
async def push_unsubscribe(
    endpoint: str,
    user_id: Annotated[UUID, Depends(require_user_id)],
    service: Annotated[NotificationService, Depends(get_notification_service)],
) -> ApiResponse[PushSubscribeResponse]:
    removed = await service.unsubscribe_push(user_id, endpoint)
    return ApiResponse(data=PushSubscribeResponse(subscribed=not removed))


@router.websocket("/ws")
async def websocket_notifications(
    websocket: WebSocket,
    token: str = Query(...),
):
    settings = Settings()
    payload = decode_access_token(token, settings.jwt_secret)
    if not payload:
        await websocket.close(code=4001)
        return
    user_id = UUID(payload.sub)
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)