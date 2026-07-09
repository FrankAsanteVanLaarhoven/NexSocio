from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from nexus_common.domain.models import ApiResponse, HealthResponse

from services.robot_agent.api.deps import (
    get_current_user_id,
    get_robot_service,
    get_settings,
    get_token,
)
from services.robot_agent.application.dtos import (
    CommandRequest,
    CommandResponse,
    CreateTwinRequest,
    DigitalTwinResponse,
    RobotDashboardResponse,
)
from services.robot_agent.application.services import RobotAgentService
from services.robot_agent.infrastructure.config import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(service=settings.service_name)


@router.get("/twins", response_model=ApiResponse[list[DigitalTwinResponse]])
async def list_twins(
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[list[DigitalTwinResponse]]:
    twins = await service.list_twins()
    return ApiResponse(data=twins)


@router.post("/twins", response_model=ApiResponse[DigitalTwinResponse])
async def create_twin(
    request: CreateTwinRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[DigitalTwinResponse]:
    twin = await service.create_twin(user_id, request)
    return ApiResponse(data=twin)


@router.post("/commands", response_model=ApiResponse[CommandResponse])
async def issue_command(
    request: CommandRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    token: Annotated[str, Depends(get_token)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[CommandResponse]:
    result = await service.issue_command(user_id, request, token)
    return ApiResponse(data=result)


@router.get("/dashboard", response_model=ApiResponse[RobotDashboardResponse])
async def dashboard(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[RobotDashboardResponse]:
    result = await service.get_dashboard(user_id)
    return ApiResponse(data=result)