from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from nexus_common.domain.enums import UserMode, VerificationStatus

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T | None = None
    error: str | None = None


class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class UserProfile(BaseModel):
    id: UUID
    email: EmailStr
    display_name: str
    mode: UserMode
    age_verified: bool = False
    created_at: datetime


class ZKPAgeProof(BaseModel):
    """Zero-knowledge age proof submission (stub interface for production ZKP library)."""

    proof: str = Field(..., description="Serialized ZKP proof or stub token")
    public_inputs: dict[str, str] = Field(default_factory=dict)
    minimum_age: int = Field(default=13, ge=0)


class ZKPVerificationResult(BaseModel):
    verified: bool
    status: VerificationStatus
    minimum_age_met: bool
    message: str
    proof_hash: str | None = None


def parse_cors_origins(v) -> list[str]:
    import json
    if isinstance(v, str):
        try:
            decoded = json.loads(v)
            if isinstance(decoded, list):
                return [str(x) for x in decoded]
        except json.JSONDecodeError:
            pass
        return [x.strip() for x in v.split(",") if x.strip()]
    return v