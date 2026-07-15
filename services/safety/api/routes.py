from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from nexus_common.domain.models import ApiResponse, HealthResponse
from nexus_common.security.jwt import TokenPayload

from services.safety.api.deps import (
    get_current_user_id,
    get_current_admin,
    get_current_admin_payload,
    get_token,
    get_safety_service,
    get_settings,
)
from services.safety.application.dtos import (
    ModerateRequest,
    ModerationResponse,
    ReportRequest,
    ReportResponse,
    SafetyDashboardResponse,
    ContentReportResponse,
    ReportActionRequest,
    ModeratorActionLogResponse,
    SafetyPolicyUpdateRequest,
    SafetyPolicyResponse,
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


@router.get("/admin/reports", response_model=ApiResponse[list[ContentReportResponse]])
async def admin_list_reports(
    admin_id: Annotated[UUID, Depends(get_current_admin)],
    service: Annotated[SafetyService, Depends(get_safety_service)],
) -> ApiResponse[list[ContentReportResponse]]:
    reports = await service.list_reports_admin()
    return ApiResponse(data=reports)


@router.patch("/admin/reports/{report_id}/action", response_model=ApiResponse[bool])
async def admin_moderate_report(
    report_id: UUID,
    request: ReportActionRequest,
    admin: Annotated[TokenPayload, Depends(get_current_admin_payload)],
    token: Annotated[str, Depends(get_token)],
    service: Annotated[SafetyService, Depends(get_safety_service)],
) -> ApiResponse[bool]:
    success = await service.moderate_report_action_admin(
        report_id=report_id,
        request=request,
        moderator_id=UUID(admin.sub),
        moderator_name=admin.resolved_display_name(),
        token=token,
    )
    return ApiResponse(data=success)


@router.get("/admin/audit-logs", response_model=ApiResponse[list[ModeratorActionLogResponse]])
async def admin_list_audit_logs(
    admin_id: Annotated[UUID, Depends(get_current_admin)],
    service: Annotated[SafetyService, Depends(get_safety_service)],
) -> ApiResponse[list[ModeratorActionLogResponse]]:
    logs = await service.list_audit_logs_admin()
    return ApiResponse(data=logs)


@router.get("/admin/policies", response_model=ApiResponse[list[SafetyPolicyResponse]])
async def admin_list_policies(
    admin_id: Annotated[UUID, Depends(get_current_admin)],
    service: Annotated[SafetyService, Depends(get_safety_service)],
) -> ApiResponse[list[SafetyPolicyResponse]]:
    policies = await service.list_policies_admin()
    return ApiResponse(data=policies)


@router.put("/admin/policies", response_model=ApiResponse[SafetyPolicyResponse])
async def admin_update_policy(
    request: SafetyPolicyUpdateRequest,
    admin: Annotated[TokenPayload, Depends(get_current_admin_payload)],
    service: Annotated[SafetyService, Depends(get_safety_service)],
) -> ApiResponse[SafetyPolicyResponse]:
    policy = await service.update_policy_admin(
        request=request,
        moderator_id=UUID(admin.sub),
        moderator_name=admin.resolved_display_name(),
    )
    return ApiResponse(data=policy)