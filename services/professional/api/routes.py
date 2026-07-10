from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from nexus_common.domain.models import ApiResponse, HealthResponse

from services.professional.api.deps import (
    AuthContext,
    get_auth_context,
    get_professional_service,
    get_settings,
    get_token,
)
from services.professional.application.dtos import (
    BusinessProfileResponse,
    CorporateDashboardResponse,
    CreateOrganizationRequest,
    OrganizationResponse,
    OrgMembershipResponse,
    ProfessionalDashboardResponse,
    ProfessionalProfileResponse,
    UpdateProfessionalProfileRequest,
    UpsertBusinessProfileRequest,
)
from services.professional.application.services import ProfessionalService
from services.professional.infrastructure.config import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(service=settings.service_name)


@router.get("/profile", response_model=ApiResponse[ProfessionalProfileResponse])
async def get_profile(
    token: Annotated[str, Depends(get_token)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[ProfessionalProfileResponse]:
    result = await service.get_profile(token)
    return ApiResponse(data=result)


@router.put("/profile", response_model=ApiResponse[ProfessionalProfileResponse])
async def update_profile(
    request: UpdateProfessionalProfileRequest,
    token: Annotated[str, Depends(get_token)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[ProfessionalProfileResponse]:
    result = await service.update_profile(token, request)
    return ApiResponse(data=result)


@router.get("/dashboard", response_model=ApiResponse[ProfessionalDashboardResponse])
async def dashboard(
    token: Annotated[str, Depends(get_token)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[ProfessionalDashboardResponse]:
    result = await service.get_dashboard(token)
    return ApiResponse(data=result)


@router.get("/dashboard/corporate", response_model=ApiResponse[CorporateDashboardResponse])
async def corporate_dashboard(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    token: Annotated[str, Depends(get_token)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[CorporateDashboardResponse]:
    result = await service.get_corporate_dashboard(token, auth.user_id)
    return ApiResponse(data=result)


@router.get("/business-profile", response_model=ApiResponse[BusinessProfileResponse | None])
async def get_business_profile(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[BusinessProfileResponse | None]:
    result = await service.get_business_profile(auth.user_id)
    return ApiResponse(data=result)


@router.put("/business-profile", response_model=ApiResponse[BusinessProfileResponse])
async def upsert_business_profile(
    request: UpsertBusinessProfileRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[BusinessProfileResponse]:
    result = await service.upsert_business_profile(auth.user_id, request)
    return ApiResponse(data=result)


@router.get("/organizations", response_model=ApiResponse[list[OrganizationResponse]])
async def list_organizations(
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
    industry: str | None = Query(default=None),
) -> ApiResponse[list[OrganizationResponse]]:
    result = await service.list_organizations(industry=industry)
    return ApiResponse(data=result)


@router.post("/organizations", response_model=ApiResponse[OrganizationResponse])
async def create_organization(
    request: CreateOrganizationRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[OrganizationResponse]:
    result = await service.create_organization(auth.user_id, request)
    return ApiResponse(data=result)


@router.get("/organizations/memberships", response_model=ApiResponse[list[OrgMembershipResponse]])
async def list_memberships(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[list[OrgMembershipResponse]]:
    result = await service.list_memberships(auth.user_id)
    return ApiResponse(data=result)


@router.get("/organizations/{org_id}/membership-check", response_model=ApiResponse[bool])
async def membership_check(
    org_id: UUID,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[bool]:
    result = await service.user_belongs_to_org(auth.user_id, org_id)
    return ApiResponse(data=result)