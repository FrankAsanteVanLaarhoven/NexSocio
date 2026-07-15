from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from nexus_common.domain.feature_flags import BETA_COHORTS, DEFAULT_FLAGS, FeatureFlagsResponse
from nexus_common.domain.models import ApiResponse, HealthResponse, ZKPAgeProof
from nexus_common.security.zkp import ZKPVerifier
from services.identity.infrastructure.models import UserModel

from services.identity.application.auth_dtos import (
    AuthLoginResponse,
    AvailableAuthMethods,
    BiometricLoginRequest,
    EnrollBiometricRequest,
    EnrollPinRequest,
    EnrollWebAuthnRequest,
    KidsFaceLoginRequest,
    KidsRegisterRequest,
    KidsRegisterResponse,
    LoginRequest,
    ParentalApprovalRequest,
    ParentalApprovalResponse,
    PasswordEnrollBiometricRequest,
    PasswordEnrollPinRequest,
    PasswordEnrollWebAuthnRequest,
    PasswordVerifyRequest,
    PinLoginRequest,
    WebAuthnChallengeResponse,
    WebAuthnLoginRequest,
)
from services.identity.application.dtos import (
    AdminMemberResponse,
    ModeSelectRequest,
    ModeSelectResponse,
    PublicUserResponse,
    RegisterRequest,
    RegisterResponse,
    UpdateProfileRequest,
    UserResponse,
)
from services.identity.application.location_dtos import (
    LocationUpdateRequest,
    MemberLocationResponse,
    UserLocationResponse,
)
from services.identity.application.location_service import LocationService
from services.identity.application.services import IdentityService
from services.identity.api.deps import (
    get_auth_service,
    get_current_user_id,
    get_current_admin,
    get_identity_service,
    get_location_service,
    get_settings,
)
from services.identity.application.auth_service import AuthService
from services.identity.infrastructure.config import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(service=settings.service_name)


@router.post("/auth/register", response_model=ApiResponse[RegisterResponse])
async def register(
    request: RegisterRequest,
    service: Annotated[IdentityService, Depends(get_identity_service)],
) -> ApiResponse[RegisterResponse]:
    result = await service.register(request)
    return ApiResponse(data=result)


@router.post("/auth/mode", response_model=ApiResponse[ModeSelectResponse])
async def select_mode(
    request: ModeSelectRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[IdentityService, Depends(get_identity_service)],
) -> ApiResponse[ModeSelectResponse]:
    result = await service.select_mode(user_id, request)
    return ApiResponse(data=result)


@router.post("/location", response_model=ApiResponse[UserLocationResponse])
async def update_location(
    request: LocationUpdateRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[IdentityService, Depends(get_identity_service)],
    loc_service: Annotated[LocationService, Depends(get_location_service)],
) -> ApiResponse[UserLocationResponse]:
    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    result = await loc_service.update_location(user_id, user.display_name, request)
    return ApiResponse(data=result)


@router.get("/location/me", response_model=ApiResponse[UserLocationResponse | None])
async def get_my_location(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    loc_service: Annotated[LocationService, Depends(get_location_service)],
) -> ApiResponse[UserLocationResponse | None]:
    result = await loc_service.get_my_location(user_id)
    return ApiResponse(data=result)


@router.get("/location/members", response_model=ApiResponse[list[MemberLocationResponse]])
async def list_member_locations(
    loc_service: Annotated[LocationService, Depends(get_location_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ApiResponse[list[MemberLocationResponse]]:
    members = await loc_service.get_findable_members()
    return ApiResponse(data=[m for m in members if m.user_id != user_id])


@router.get("/location/{target_id}", response_model=ApiResponse[MemberLocationResponse | None])
async def get_member_location(
    target_id: UUID,
    loc_service: Annotated[LocationService, Depends(get_location_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ApiResponse[MemberLocationResponse | None]:
    if target_id == user_id:
        mine = await loc_service.get_my_location(user_id)
        if not mine:
            return ApiResponse(data=None)
        return ApiResponse(
            data=MemberLocationResponse(
                user_id=mine.user_id,
                display_name=mine.display_name,
                lat=mine.lat,
                lng=mine.lng,
                location_label=mine.location_label,
                is_live=mine.is_live,
                find_me_enabled=mine.find_me_enabled,
                live_since=mine.live_since,
                updated_at=mine.updated_at,
            )
        )
    result = await loc_service.get_member_location(target_id)
    return ApiResponse(data=result)


@router.get("/users/me", response_model=ApiResponse[UserResponse])
async def get_me(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[IdentityService, Depends(get_identity_service)],
) -> ApiResponse[UserResponse]:
    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ApiResponse(data=user)


@router.put("/users/me", response_model=ApiResponse[UserResponse])
async def update_me(
    request: UpdateProfileRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[IdentityService, Depends(get_identity_service)],
) -> ApiResponse[UserResponse]:
    user = await service.update_profile(user_id, request)
    return ApiResponse(data=user)


@router.get("/users/search", response_model=ApiResponse[list[PublicUserResponse]])
async def search_users(
    service: Annotated[IdentityService, Depends(get_identity_service)],
    q: str = Query(..., min_length=1),
    limit: int = Query(default=20, le=50),
) -> ApiResponse[list[PublicUserResponse]]:
    users = await service.search_users(q, limit)
    return ApiResponse(data=users)


@router.get("/users/{user_id}", response_model=ApiResponse[PublicUserResponse])
async def get_user(
    user_id: UUID,
    service: Annotated[IdentityService, Depends(get_identity_service)],
) -> ApiResponse[PublicUserResponse]:
    user = await service.get_public_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ApiResponse(data=user)


@router.get("/features", response_model=ApiResponse[FeatureFlagsResponse])
async def get_features(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[IdentityService, Depends(get_identity_service)],
) -> ApiResponse[FeatureFlagsResponse]:
    user = await service.get_user(user_id)
    cohort = user.beta_cohort if user else "public_beta"
    beta_access = bool(cohort and (cohort in BETA_COHORTS or cohort == "public_beta"))
    return ApiResponse(
        data=FeatureFlagsResponse(
            flags=DEFAULT_FLAGS,
            cohort=cohort,
            beta_access=beta_access,
        )
    )


@router.post("/zkp/stub-proof", response_model=ApiResponse[ZKPAgeProof])
async def generate_stub_proof(is_adult: bool = True) -> ApiResponse[ZKPAgeProof]:
    verifier = ZKPVerifier()
    proof = verifier.generate_stub_proof(is_adult=is_adult)
    return ApiResponse(data=proof)


@router.post("/auth/login", response_model=ApiResponse[AuthLoginResponse])
async def login_password(
    request: LoginRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthLoginResponse]:
    return ApiResponse(data=await auth.login_password(request))


@router.post("/auth/login/pin", response_model=ApiResponse[AuthLoginResponse])
async def login_pin(
    request: PinLoginRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthLoginResponse]:
    return ApiResponse(data=await auth.login_pin(request))


@router.post("/auth/login/kids-face", response_model=ApiResponse[AuthLoginResponse])
async def login_kids_face(
    request: KidsFaceLoginRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthLoginResponse]:
    return ApiResponse(data=await auth.login_kids_face(request))


@router.post("/auth/login/biometric", response_model=ApiResponse[AuthLoginResponse])
async def login_biometric(
    request: BiometricLoginRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthLoginResponse]:
    return ApiResponse(data=await auth.login_biometric(request))


@router.get("/auth/methods", response_model=ApiResponse[AvailableAuthMethods])
async def get_auth_methods(
    auth: Annotated[AuthService, Depends(get_auth_service)],
    email: str = Query(..., min_length=3),
) -> ApiResponse[AvailableAuthMethods]:
    return ApiResponse(data=await auth.get_available_methods(email))


@router.post("/auth/webauthn/register/options", response_model=ApiResponse[WebAuthnChallengeResponse])
async def webauthn_register_options(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[WebAuthnChallengeResponse]:
    return ApiResponse(data=await auth.webauthn_register_options(user_id))


@router.post("/auth/webauthn/login/options", response_model=ApiResponse[WebAuthnChallengeResponse])
async def webauthn_login_options(
    auth: Annotated[AuthService, Depends(get_auth_service)],
    email: str = Query(..., min_length=3),
) -> ApiResponse[WebAuthnChallengeResponse]:
    return ApiResponse(data=await auth.webauthn_login_options(email))


@router.post("/auth/webauthn/login", response_model=ApiResponse[AuthLoginResponse])
async def webauthn_login(
    request: WebAuthnLoginRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[AuthLoginResponse]:
    return ApiResponse(data=await auth.login_webauthn(request))


@router.post("/auth/webauthn/register/options/password", response_model=ApiResponse[WebAuthnChallengeResponse])
async def webauthn_register_options_password(
    request: PasswordVerifyRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[WebAuthnChallengeResponse]:
    return ApiResponse(data=await auth.webauthn_register_options_with_password(request))


@router.post("/auth/factors/pin/password", response_model=ApiResponse[dict])
async def enroll_pin_with_password(
    request: PasswordEnrollPinRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[dict]:
    await auth.enroll_pin_with_password(request)
    return ApiResponse(data={"enrolled": True})


@router.post("/auth/factors/biometric/password", response_model=ApiResponse[dict])
async def enroll_biometric_with_password(
    request: PasswordEnrollBiometricRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[dict]:
    await auth.enroll_biometric_with_password(request)
    return ApiResponse(data={"enrolled": True})


@router.post("/auth/factors/webauthn/password", response_model=ApiResponse[dict])
async def enroll_webauthn_with_password(
    request: PasswordEnrollWebAuthnRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[dict]:
    await auth.enroll_webauthn_with_password(request)
    return ApiResponse(data={"enrolled": True})


@router.post("/auth/factors/pin", response_model=ApiResponse[dict])
async def enroll_pin(
    request: EnrollPinRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[dict]:
    await auth.enroll_pin(user_id, request)
    return ApiResponse(data={"enrolled": True})


@router.post("/auth/factors/biometric", response_model=ApiResponse[dict])
async def enroll_biometric(
    request: EnrollBiometricRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[dict]:
    await auth.enroll_biometric(user_id, request)
    return ApiResponse(data={"enrolled": True})


@router.post("/auth/factors/webauthn", response_model=ApiResponse[dict])
async def enroll_webauthn(
    request: EnrollWebAuthnRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[dict]:
    await auth.enroll_webauthn(user_id, request)
    return ApiResponse(data={"enrolled": True})


@router.post("/auth/parental-approval", response_model=ApiResponse[ParentalApprovalResponse])
async def create_parental_approval(
    request: ParentalApprovalRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[ParentalApprovalResponse]:
    return ApiResponse(data=await auth.create_parental_approval(user_id, request))


@router.post("/auth/register/kids", response_model=ApiResponse[KidsRegisterResponse])
async def register_kids(
    request: KidsRegisterRequest,
    auth: Annotated[AuthService, Depends(get_auth_service)],
) -> ApiResponse[KidsRegisterResponse]:
    return ApiResponse(data=await auth.register_kids(request))


@router.get("/admin/users", response_model=ApiResponse[list[AdminMemberResponse]])
async def admin_list_users(
    admin: Annotated[UserModel, Depends(get_current_admin)],
    identity: Annotated[IdentityService, Depends(get_identity_service)],
) -> ApiResponse[list[AdminMemberResponse]]:
    members = await identity.list_members_admin()
    return ApiResponse(data=members)


@router.patch("/admin/users/{user_id}/status", response_model=ApiResponse[dict])
async def admin_update_user_status(
    user_id: UUID,
    status: str,
    admin: Annotated[UserModel, Depends(get_current_admin)],
    identity: Annotated[IdentityService, Depends(get_identity_service)],
) -> ApiResponse[dict]:
    await identity.update_user_status_admin(user_id, status)
    return ApiResponse(data={"success": True})


@router.patch("/admin/users/{user_id}/role", response_model=ApiResponse[dict])
async def admin_update_user_role(
    user_id: UUID,
    role: str,
    admin: Annotated[UserModel, Depends(get_current_admin)],
    identity: Annotated[IdentityService, Depends(get_identity_service)],
) -> ApiResponse[dict]:
    await identity.update_user_role_admin(user_id, role)
    return ApiResponse(data={"success": True})