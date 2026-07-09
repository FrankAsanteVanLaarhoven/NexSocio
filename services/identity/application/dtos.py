from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from nexus_common.domain.enums import UserMode
from nexus_common.domain.models import ZKPAgeProof, ZKPVerificationResult


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: str = Field(..., min_length=2, max_length=64)
    age_proof: ZKPAgeProof


class RegisterResponse(BaseModel):
    user_id: UUID
    email: str
    display_name: str
    mode: UserMode
    age_verified: bool
    access_token: str
    zkp_result: ZKPVerificationResult


class ModeSelectRequest(BaseModel):
    mode: UserMode


class ModeSelectResponse(BaseModel):
    user_id: UUID
    mode: UserMode
    access_token: str


class UpdateProfileRequest(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=64)
    bio: str | None = Field(default=None, max_length=500)
    headline: str | None = Field(default=None, max_length=128)
    skills: str | None = Field(default=None, max_length=500)
    company: str | None = Field(default=None, max_length=128)
    current_password: str | None = None
    new_password: str | None = Field(default=None, min_length=8)


class UserResponse(BaseModel):
    id: UUID
    email: str
    display_name: str
    mode: UserMode
    age_verified: bool
    bio: str | None = None
    headline: str | None = None
    skills: str | None = None
    company: str | None = None
    beta_cohort: str | None = "public_beta"
    subscription_tier: str = "free"
    can_hide_ai_tag: bool = False
    created_at: datetime | None = None


class PublicUserResponse(BaseModel):
    id: UUID
    display_name: str
    mode: UserMode
    bio: str | None = None
    headline: str | None = None
    skills: str | None = None
    company: str | None = None