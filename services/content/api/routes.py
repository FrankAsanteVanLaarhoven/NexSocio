from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from nexus_common.domain.enums import FeedType, UserMode, ViewContext
from nexus_common.domain.models import ApiResponse, HealthResponse

from services.content.api.deps import (
    AuthContext,
    get_auth_context,
    get_content_service,
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
    PostResponse,
)
from services.content.application.services import ContentService
from services.content.infrastructure.config import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(service=settings.service_name)


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


@router.get("/comments/{post_id}", response_model=ApiResponse[list[CommentResponse]])
async def list_comments(
    post_id: UUID,
    service: Annotated[ContentService, Depends(get_content_service)],
) -> ApiResponse[list[CommentResponse]]:
    comments = await service.get_comments(post_id)
    return ApiResponse(data=comments)