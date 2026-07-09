from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class DigitalTwinResponse(BaseModel):
    agent_id: str
    name: str
    status: str
    safety_channel: str
    social_status: str
    capabilities: str | None = None
    owner_id: UUID | None = None
    owner_display_name: str | None = None
    persona_greeting: str | None = None
    is_active: bool = False


class CommandRequest(BaseModel):
    agent_id: str
    command: str = Field(..., min_length=1, max_length=64)


class CommandResponse(BaseModel):
    agent_id: str
    command: str
    status: str
    safety_check: str
    message: str


class CreateTwinRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128)
    capabilities: str | None = None
    owner_display_name: str | None = None


class ActivateTwinRequest(BaseModel):
    owner_display_name: str = Field(..., min_length=2, max_length=64)


class TwinMessageRequest(BaseModel):
    from_name: str = Field(..., min_length=1, max_length=64)
    body: str = Field(..., min_length=1, max_length=2000)


class TwinMessageResponse(BaseModel):
    id: UUID
    twin_agent_id: str
    from_name: str
    body: str
    direction: str
    created_at: datetime


class TwinPostRequest(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)
    context: str = "personal"


class TwinBriefingResponse(BaseModel):
    agent_id: str
    twin_name: str
    owner_display_name: str
    greeting: str
    message_count: int
    post_count: int
    activities: list[dict]
    messages: list[TwinMessageResponse]
    voice_summary: str


class RobotDashboardResponse(BaseModel):
    twins: list[DigitalTwinResponse]
    recent_commands: list[dict]
    safety_channel_status: str
    active_twin: DigitalTwinResponse | None = None