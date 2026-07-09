from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from nexus_common.domain.enums import ContentVisibility, UserMode, ViewContext


class CreatePostRequest(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)
    visibility: ContentVisibility = ContentVisibility.PUBLIC
    context: ViewContext = ViewContext.PERSONAL
    media_url: str | None = Field(default=None, max_length=512)


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
    created_at: datetime


class FeedResponse(BaseModel):
    posts: list[PostResponse]
    total: int
    feed_type: str
    context: str