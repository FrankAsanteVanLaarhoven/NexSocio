from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class LocationUpdateRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    location_label: str = Field(..., min_length=1, max_length=128)
    find_me_enabled: bool = False
    share_with_followers: bool = False
    show_live_tag: bool = True
    is_live: bool = False
    source: str = Field(default="app", pattern=r"^(app|login|live|find_me)$")


class UserLocationResponse(BaseModel):
    user_id: UUID
    display_name: str
    lat: float
    lng: float
    location_label: str
    find_me_enabled: bool
    share_with_followers: bool
    show_live_tag: bool
    is_live: bool
    last_login_label: str | None = None
    last_login_at: datetime | None = None
    live_since: datetime | None = None
    updated_at: datetime


class MemberLocationResponse(BaseModel):
    user_id: UUID
    display_name: str
    lat: float
    lng: float
    location_label: str
    is_live: bool
    find_me_enabled: bool
    live_since: datetime | None = None
    updated_at: datetime