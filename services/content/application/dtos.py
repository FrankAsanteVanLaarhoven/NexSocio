from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from nexus_common.domain.enums import ContentVisibility, UserMode, ViewContext


class CreatePostRequest(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)
    visibility: ContentVisibility = ContentVisibility.PUBLIC
    context: ViewContext = ViewContext.PERSONAL
    media_url: str | None = Field(default=None, max_length=2_000_000)
    post_type: str = Field(default="text", pattern=r"^(text|reel|photo|live)$")
    filter_preset: str | None = Field(default=None, max_length=64)
    is_twin_post: bool = False
    twin_agent_id: str | None = None
    owner_display_name: str | None = None
    ai_assisted: bool = False
    hide_ai_tag: bool = False
    place_id: str | None = None
    place_name: str | None = None
    place_address: str | None = None
    place_lat: float | None = None
    place_lng: float | None = None
    location_label: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None
    is_live_session: bool = False
    org_id: UUID | None = None


class MediaUploadResponse(BaseModel):
    url: str
    filename: str
    original_name: str
    mime_type: str
    media_type: str
    size_bytes: int
    context: str
    max_duration_sec: int | None = None
    aspect_hint: str | None = None


class AIComposeRequest(BaseModel):
    draft: str = Field(..., min_length=1, max_length=5000)
    tone: str = Field(default="friendly", pattern=r"^(friendly|professional|bold|casual)$")
    context: str = Field(default="social", pattern=r"^(social|professional)$")


class AIComposeResponse(BaseModel):
    composed: str
    tagged_as: str = "NEXSOCIO AI"


class PostResponse(BaseModel):
    id: UUID
    author_id: UUID
    author_name: str
    body: str
    mode: UserMode
    context: ViewContext
    visibility: ContentVisibility
    media_url: str | None = None
    moderation_status: str = "approved"
    post_type: str = "text"
    filter_preset: str | None = None
    is_twin_post: bool = False
    twin_agent_id: str | None = None
    is_ai_generated: bool = False
    show_ai_tag: bool = False
    place_id: str | None = None
    place_name: str | None = None
    place_address: str | None = None
    place_lat: float | None = None
    place_lng: float | None = None
    location_label: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None
    is_live_session: bool = False
    org_id: UUID | None = None
    org_name: str | None = None
    created_at: datetime


class PlacePostResponse(BaseModel):
    post_id: str
    author_name: str
    place_id: str | None = None
    place_name: str | None = None
    place_address: str | None = None
    place_lat: float | None = None
    place_lng: float | None = None
    body: str
    created_at: datetime


class CreateCommentRequest(BaseModel):
    post_id: UUID
    body: str = Field(..., min_length=1, max_length=1000)


class CommentResponse(BaseModel):
    id: UUID
    post_id: UUID
    author_id: UUID
    author_name: str
    body: str
    moderation_status: str
    created_at: datetime


class FeedResponse(BaseModel):
    posts: list[PostResponse]
    total: int
    feed_type: str
    context: str