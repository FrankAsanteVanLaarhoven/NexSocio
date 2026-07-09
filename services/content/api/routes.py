from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from nexus_common.domain.enums import FeedType, UserMode, ViewContext
from nexus_common.domain.models import ApiResponse, HealthResponse

from nexus_common.media.formats import SPECS

from services.content.api.deps import (
    AuthContext,
    get_auth_context,
    get_content_service,
    get_media_upload_service,
    get_settings,
    get_token,
)
from services.content.application.dtos import (
    AIComposeRequest,
    AIComposeResponse,
    CommentResponse,
    CreateCommentRequest,
    CreatePostRequest,
    FeedResponse,
    MediaUploadResponse,
    PostResponse,
)
from services.content.application.media_upload import MediaUploadService
from services.content.application.services import ContentService
from services.content.infrastructure.config import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(service=settings.service_name)


@router.get("/media/formats", response_model=ApiResponse[dict])
async def media_formats() -> ApiResponse[dict]:
    return ApiResponse(
        data={
            k: {
                "label": v.label,
                "extensions": list(v.extensions),
                "mime_types": list(v.mime_types),
                "max_bytes": v.max_bytes,
                "max_duration_sec": v.max_duration_sec,
                "aspect_hint": v.aspect_hint,
            }
            for k, v in SPECS.items()
        }
    )


@router.post("/media/upload", response_model=ApiResponse[MediaUploadResponse])
async def upload_media(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    upload_service: Annotated[MediaUploadService, Depends(get_media_upload_service)],
    file: UploadFile = File(...),
    context: str = Form(default="photo"),
) -> ApiResponse[MediaUploadResponse]:
    if context not in SPECS:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail=f"Unknown context: {context}")
    result = await upload_service.save(file, context)
    return ApiResponse(data=MediaUploadResponse(**result))


@router.post("/ai/compose", response_model=ApiResponse[AIComposeResponse])
async def ai_compose(
    request: AIComposeRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ContentService, Depends(get_content_service)],
) -> ApiResponse[AIComposeResponse]:
    result = await service.compose_ai(request)
    return ApiResponse(data=result)


@router.post("/posts", response_model=ApiResponse[PostResponse])
async def create_post(
    request: CreatePostRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    token: Annotated[str, Depends(get_token)],
    service: Annotated[ContentService, Depends(get_content_service)],
) -> ApiResponse[PostResponse]:
    result = await service.create_post(
        author_id=auth.user_id,
        author_name=auth.display_name,
        mode=auth.mode,
        request=request,
        token=token,
    )
    return ApiResponse(data=result)


@router.get("/feed", response_model=ApiResponse[FeedResponse])
async def get_feed(
    service: Annotated[ContentService, Depends(get_content_service)],
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    token: Annotated[str, Depends(get_token)],
    feed_type: FeedType = Query(default=FeedType.GLOBAL),
    context: ViewContext = Query(default=ViewContext.PERSONAL),
    mode: UserMode | None = Query(default=None),
    limit: int = Query(default=50, le=100),
) -> ApiResponse[FeedResponse]:
    result = await service.get_feed(
        feed_type=feed_type,
        context=context,
        mode=mode,
        user_id=auth.user_id if auth else None,
        token=token,
        limit=limit,
    )
    return ApiResponse(data=result)


@router.post("/comments", response_model=ApiResponse[CommentResponse])
async def create_comment(
    request: CreateCommentRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ContentService, Depends(get_content_service)],
) -> ApiResponse[CommentResponse]:
    result = await service.create_comment(
        author_id=auth.user_id,
        author_name=auth.display_name,
        mode=auth.mode,
        request=request,
    )
    return ApiResponse(data=result)


@router.get("/places/posts", response_model=ApiResponse[list[dict]])
async def placed_posts(
    service: Annotated[ContentService, Depends(get_content_service)],
) -> ApiResponse[list[dict]]:
    data = await service.get_placed_posts()
    return ApiResponse(data=data)


@router.get("/comments/{post_id}", response_model=ApiResponse[list[CommentResponse]])
async def list_comments(
    post_id: UUID,
    service: Annotated[ContentService, Depends(get_content_service)],
) -> ApiResponse[list[CommentResponse]]:
    comments = await service.get_comments(post_id)
    return ApiResponse(data=comments)