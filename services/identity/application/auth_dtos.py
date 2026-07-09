from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from nexus_common.domain.enums import UserMode
from nexus_common.domain.models import ZKPAgeProof, ZKPVerificationResult


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class PinLoginRequest(BaseModel):
    email: EmailStr
    pin: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class BiometricLoginRequest(BaseModel):
    email: EmailStr
    factor_type: str = Field(..., pattern=r"^(face|palm|voice)$")
    template_hash: str = Field(..., min_length=16, max_length=128)
    voice_command: str | None = None


class KidsFaceLoginRequest(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=64)
    face_template_hash: str = Field(..., min_length=16, max_length=128)


class WebAuthnChallengeResponse(BaseModel):
    challenge: str
    rp_id: str
    user_id: str | None = None
    user_name: str | None = None
    user_display_name: str | None = None
    allow_credentials: list[dict[str, str]] | None = None


class WebAuthnLoginRequest(BaseModel):
    email: EmailStr | None = None
    credential_id: str
    challenge: str


class EnrollPinRequest(BaseModel):
    pin: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class EnrollBiometricRequest(BaseModel):
    factor_type: str = Field(..., pattern=r"^(face|palm|voice)$")
    template_hash: str = Field(..., min_length=16, max_length=128)
    label: str | None = None


class EnrollWebAuthnRequest(BaseModel):
    credential_id: str
    challenge: str
    label: str | None = "Passkey"


class ParentalApprovalRequest(BaseModel):
    child_display_name: str = Field(..., min_length=2, max_length=64)


class ParentalApprovalResponse(BaseModel):
    approval_code: str
    child_display_name: str
    expires_at: str


class KidsRegisterRequest(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=64)
    face_template_hash: str = Field(..., min_length=16, max_length=128)
    parental_approval_code: str = Field(..., min_length=6, max_length=12)
    age_proof: ZKPAgeProof


class AuthLoginResponse(BaseModel):
    user_id: UUID
    email: str
    display_name: str
    mode: UserMode
    age_verified: bool
    access_token: str
    auth_method: str


class KidsRegisterResponse(BaseModel):
    user_id: UUID
    display_name: str
    mode: UserMode
    access_token: str
    zkp_result: ZKPVerificationResult
    parental_approved: bool


class AvailableAuthMethods(BaseModel):
    email: str
    methods: list[str]