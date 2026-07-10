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


class BusinessToolsStatus(BaseModel):
    user_id: UUID
    tools_active: bool = False
    trial_active: bool = False
    trial_ends_at: datetime | None = None
    subscription_status: str = "none"
    monthly_price_gbp: float = 19.0


class BusinessToolsAccess(BaseModel):
    user_id: UUID
    tools_allowed: bool = False
    status: str = "none"
    trial_ends_at: datetime | None = None
    message: str = ""


class ProfessionalDashboardResponse(BaseModel):
    profile: ProfessionalProfileResponse
    insights: list[NetworkInsight]
    connection_suggestions: list[str]
    business_tools: BusinessToolsAccess | None = None


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
    sector_category: str | None = None
    size_band: str | None = None
    website: str | None = None
    description: str | None = None
    corporate_email: str | None = None
    email_domain: str | None = None
    email_verified: bool = False
    credentials_verified: bool = False
    can_serve_public: bool = False
    verified: bool = False
    created_at: datetime | None = None


class CreateOrganizationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    slug: str = Field(..., min_length=2, max_length=64, pattern=r"^[a-z0-9-]+$")
    corporate_email: str = Field(..., min_length=5, max_length=256)
    sector_category: str = Field(..., min_length=2, max_length=64)
    industry: str | None = Field(default=None, max_length=64)
    size_band: str | None = Field(default=None, max_length=32)
    website: str | None = Field(default=None, max_length=256)
    description: str | None = Field(default=None, max_length=2000)


class VerifyCorporateEmailRequest(BaseModel):
    corporate_email: str = Field(..., min_length=5, max_length=256)


class SubmitCorporateCredentialsRequest(BaseModel):
    sector_category: str = Field(..., min_length=2, max_length=64)
    registration_number: str = Field(..., min_length=2, max_length=128)
    license_body: str | None = Field(default=None, max_length=128)
    notes: str | None = Field(default=None, max_length=500)


class CorporateCredentialResponse(BaseModel):
    org_id: UUID
    sector_category: str
    registration_number: str
    license_body: str | None = None
    status: str
    notes: str | None = None


class CorporateComplianceStatus(BaseModel):
    org_id: UUID
    corporate_email: str | None = None
    email_domain: str | None = None
    sector_category: str | None = None
    email_verified: bool = False
    credentials_verified: bool = False
    can_serve_public: bool = False
    networking_trial_active: bool = False
    networking_active: bool = False
    trial_ends_at: datetime | None = None
    subscription_status: str = "none"
    monthly_price_gbp: float = 49.0


class OrgNetworkingAccess(BaseModel):
    org_id: UUID
    networking_allowed: bool
    status: str
    trial_ends_at: datetime | None = None
    message: str


class CorporateServiceListingResponse(BaseModel):
    id: UUID
    org_id: UUID
    org_name: str
    sector_category: str
    title: str
    description: str
    price_hint: str | None = None
    is_public: bool = True
    created_at: datetime | None = None


class CreateCorporateServiceRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=128)
    description: str = Field(default="", max_length=2000)
    price_hint: str | None = Field(default=None, max_length=64)


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
    compliance: list[CorporateComplianceStatus] = []
    networking_access: list[OrgNetworkingAccess] = []


class UpsertCareerProfileRequest(BaseModel):
    headline: str | None = Field(default=None, max_length=160)
    summary: str | None = Field(default=None, max_length=2000)
    skills: str | None = Field(default=None, max_length=1000)
    cv_url: str | None = Field(default=None, max_length=2048)
    cv_filename: str | None = Field(default=None, max_length=256)
    location: str | None = Field(default=None, max_length=128)
    sector_focus: str | None = Field(default=None, max_length=64)
    open_to_work: bool | None = None
    open_to_contract: bool | None = None


class ExperienceResponse(BaseModel):
    id: UUID
    company: str
    title: str
    location: str | None = None
    start_year: str | None = None
    end_year: str | None = None
    is_current: bool = False
    description: str | None = None
    sector: str | None = None


class CareerProfileResponse(BaseModel):
    user_id: UUID
    display_name: str
    headline: str | None = None
    summary: str | None = None
    skills: str | None = None
    cv_url: str | None = None
    cv_filename: str | None = None
    location: str | None = None
    sector_focus: str | None = None
    open_to_work: bool = True
    open_to_contract: bool = False
    profile_score: int = 0
    experiences: list[ExperienceResponse] = []


class CreateExperienceRequest(BaseModel):
    company: str = Field(..., min_length=1, max_length=128)
    title: str = Field(..., min_length=1, max_length=128)
    location: str | None = Field(default=None, max_length=128)
    start_year: str | None = Field(default=None, max_length=8)
    end_year: str | None = Field(default=None, max_length=8)
    is_current: bool = False
    description: str | None = Field(default=None, max_length=2000)
    sector: str | None = Field(default=None, max_length=64)


class PeopleSearchResult(BaseModel):
    user_id: UUID
    display_name: str
    headline: str | None = None
    skills: str | None = None
    location: str | None = None
    sector_focus: str | None = None
    profile_score: int = 0
    open_to_work: bool = True
    open_to_contract: bool = False


class CreateJobRequest(BaseModel):
    org_id: UUID
    title: str = Field(..., min_length=1, max_length=128)
    description: str = Field(default="", max_length=4000)
    sector_category: str = Field(..., min_length=2, max_length=64)
    location_type: str = Field(default="hybrid", pattern=r"^(remote|hybrid|onsite)$")
    employment_type: str = Field(default="full_time", pattern=r"^(full_time|part_time|contract|intern)$")
    salary_range: str | None = Field(default=None, max_length=64)
    skills_required: str | None = Field(default=None, max_length=500)
    education_level: str | None = Field(default=None, max_length=64)


class JobPostingResponse(BaseModel):
    id: UUID
    org_id: UUID
    org_name: str
    title: str
    description: str
    sector_category: str
    location_type: str
    employment_type: str
    salary_range: str | None = None
    skills_required: str | None = None
    education_level: str | None = None
    status: str
    created_at: datetime | None = None


class ApplyJobRequest(BaseModel):
    cover_note: str | None = Field(default=None, max_length=1000)
    cv_url: str | None = Field(default=None, max_length=2048)


class JobApplicationResponse(BaseModel):
    id: UUID
    job_id: UUID
    applicant_id: UUID
    applicant_name: str
    cover_note: str | None = None
    cv_url: str | None = None
    status: str
    created_at: datetime | None = None