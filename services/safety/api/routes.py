from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from nexus_common.domain.models import ApiResponse, HealthResponse

from services.safety.api.deps import get_current_user_id, get_current_admin, get_safety_service, get_settings
from services.safety.application.dtos import (
    ModerateRequest,
    ModerationResponse,
    ReportRequest,
    ReportResponse,
    SafetyDashboardResponse,
)
from services.safety.application.services import SafetyService
from services.safety.infrastructure.config import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(service=settings.service_name)


@router.post("/moderate", response_model=ApiResponse[ModerationResponse])
async def moderate(
    request: ModerateRequest,
    service: Annotated[SafetyService, Depends(get_safety_service)],
) -> ApiResponse[ModerationResponse]:
    result = await service.moderate(request)
    return ApiResponse(data=result)


@router.post("/reports", response_model=ApiResponse[ReportResponse])
async def report(
    request: ReportRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[SafetyService, Depends(get_safety_service)],
) -> ApiResponse[ReportResponse]:
    result = await service.report_content(user_id, request)
    return ApiResponse(data=result)


@router.get("/dashboard", response_model=ApiResponse[SafetyDashboardResponse])
async def dashboard(
    service: Annotated[SafetyService, Depends(get_safety_service)],
) -> ApiResponse[SafetyDashboardResponse]:
    result = await service.get_dashboard()
    return ApiResponse(data=result)


@router.get("/admin/safety/dashboard", response_model=ApiResponse[SafetyDashboardResponse])
async def admin_dashboard(
    admin_id: Annotated[UUID, Depends(get_current_admin)],
    service: Annotated[SafetyService, Depends(get_safety_service)],
) -> ApiResponse[SafetyDashboardResponse]:
    result = await service.get_dashboard()
    return ApiResponse(data=result)