from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from nexus_common.domain.enums import ContentVisibility, UserMode, ViewContext


class CreatePostRequest(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)
    visibility: ContentVisibility = ContentVisibility.PUBLIC
    context: ViewContext = ViewContext.PERSONAL
    media_url: str | None = Field(default=None, max_length=512)
    post_type: str = Field(default="text", pattern=r"^(text|reel|photo|live)$")
    filter_preset: str | None = Field(default=None, max_length=64)
    is_twin_post: bool = False
    twin_agent_id: str | None = None
    owner_display_name: str | None = None


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