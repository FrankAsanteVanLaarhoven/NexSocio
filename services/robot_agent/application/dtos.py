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


class RobotDashboardResponse(BaseModel):
    twins: list[DigitalTwinResponse]
    recent_commands: list[dict]
    safety_channel_status: str