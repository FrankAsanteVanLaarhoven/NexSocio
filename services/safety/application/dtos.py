from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ModerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    author_mode: str = "prime"
    content_id: UUID | None = None


class ModerationResponse(BaseModel):
    allowed: bool
    score: float
    labels: list[str]
    action: str
    message: str


class ReportRequest(BaseModel):
    post_id: UUID
    reason: str = Field(..., min_length=3, max_length=64)
    details: str | None = Field(default=None, max_length=500)


class ReportResponse(BaseModel):
    id: UUID
    post_id: UUID
    status: str
    created_at: datetime


class SafetyDashboardResponse(BaseModel):
    total_events: int
    blocked_count: int
    review_count: int
    open_reports: int
    incident_rate: float
    recent_events: list[dict]