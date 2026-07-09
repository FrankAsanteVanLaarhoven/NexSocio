from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from nexus_common.domain.feature_flags import BETA_COHORTS, DEFAULT_FLAGS, FeatureFlagsResponse
from nexus_common.domain.models import ApiResponse, HealthResponse, ZKPAgeProof
from nexus_common.security.zkp import ZKPVerifier

from services.identity.application.dtos import (
    ModeSelectRequest,
    ModeSelectResponse,
    PublicUserResponse,
    RegisterRequest,
    RegisterResponse,
    UpdateProfileRequest,
    UserResponse,
)
from services.identity.application.services import IdentityService
from services.identity.api.deps import get_current_user_id, get_identity_service, get_settings
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