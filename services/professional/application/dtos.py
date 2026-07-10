from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProfessionalProfileResponse(BaseModel):
    user_id: UUID
    display_name: str
    headline: str | None = None
    company: str | None = None
    skills: str | None = None
    bio: str | None = None


class UpdateProfessionalProfileRequest(BaseModel):
    headline: str | None = Field(default=None, max_length=128)
    company: str | None = Field(default=None, max_length=128)
    skills: str | None = Field(default=None, max_length=500)
    bio: str | None = Field(default=None, max_length=500)


class NetworkInsight(BaseModel):
    label: str
    value: str
    trend: str = "neutral"


class ProfessionalDashboardResponse(BaseModel):
    profile: ProfessionalProfileResponse
    insights: list[NetworkInsight]
    connection_suggestions: list[str]


class BusinessProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    business_name: str
    category: str | None = None
    tagline: str | None = None


class UpsertBusinessProfileRequest(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=128)
    category: str | None = Field(default=None, max_length=64)
    tagline: str | None = Field(default=None, max_length=256)


class OrganizationResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    industry: str | None = None
    size_band: str | None = None
    website: str | None = None
    description: str | None = None
    verified: bool = False
    created_at: datetime | None = None


class CreateOrganizationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    slug: str = Field(..., min_length=2, max_length=64, pattern=r"^[a-z0-9-]+$")
    industry: str | None = Field(default=None, max_length=64)
    size_band: str | None = Field(default=None, max_length=32)
    website: str | None = Field(default=None, max_length=256)
    description: str | None = Field(default=None, max_length=2000)


class OrgMembershipResponse(BaseModel):
    org_id: UUID
    org_name: str
    role: str
    title: str | None = None


class CorporateDashboardResponse(BaseModel):
    profile: ProfessionalProfileResponse
    memberships: list[OrgMembershipResponse]
    insights: list[NetworkInsight]
    hiring_posts: int = 0