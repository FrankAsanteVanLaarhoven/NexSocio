from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class TeamResponse(BaseModel):
    id: UUID
    name: str
    owner_id: UUID
    sector: str
    member_count: int = 0
    created_at: datetime


class CreateTeamRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    sector: str = Field(default="business", pattern=r"^(business|professional)$")


class TeamMemberResponse(BaseModel):
    user_id: UUID
    display_name: str
    role: str


class MeetingResponse(BaseModel):
    id: UUID
    team_id: UUID | None
    host_id: UUID
    host_name: str
    title: str
    scheduled_at: datetime
    duration_min: int
    room_code: str
    status: str
    created_at: datetime


class CreateMeetingRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=256)
    scheduled_at: datetime
    duration_min: int = Field(default=30, ge=5, le=480)
    team_id: UUID | None = None


class CallResponse(BaseModel):
    id: UUID
    caller_id: UUID
    caller_name: str
    callee_id: UUID
    callee_name: str
    call_type: str
    status: str
    room_code: str
    started_at: datetime
    ended_at: datetime | None = None


class StartCallRequest(BaseModel):
    callee_id: UUID
    callee_name: str
    call_type: str = Field(default="voice", pattern=r"^(voice|video)$")


class StatusResponse(BaseModel):
    id: UUID
    user_id: UUID
    display_name: str
    text: str | None
    media_url: str | None
    media_type: str | None
    expires_at: datetime
    created_at: datetime


class CreateStatusRequest(BaseModel):
    text: str | None = Field(default=None, max_length=500)
    media_url: str | None = None
    media_type: str | None = None


class ContactResponse(BaseModel):
    id: UUID
    contact_user_id: UUID | None
    display_name: str
    email: str | None
    phone: str | None
    source: str
    created_at: datetime


class CreateContactRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=64)
    email: str | None = None
    phone: str | None = None
    contact_user_id: UUID | None = None


class ShareRequest(BaseModel):
    content_type: str = Field(..., pattern=r"^(post|status|meeting|product|update)$")
    content_id: str | None = None
    message: str = Field(..., min_length=1, max_length=2000)
    contact_ids: list[UUID] = Field(..., min_length=1, max_length=50)


class ShareResponse(BaseModel):
    shared_count: int
    contact_ids: list[UUID]


class PodcastEpisodeResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: str
    media_url: str | None
    episode_type: str
    published_at: datetime | None
    created_at: datetime


class CreatePodcastEpisodeRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=256)
    description: str = Field(default="", max_length=2000)
    media_url: str | None = None
    episode_type: str = Field(default="podcast", pattern=r"^(podcast|vlog|tv)$")
    publish: bool = False