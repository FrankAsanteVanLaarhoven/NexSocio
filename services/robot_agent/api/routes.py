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
    ActivateTwinRequest,
    AvatarVideoResponse,
    CommandRequest,
    CommandResponse,
    CreateTwinRequest,
    DigitalTwinResponse,
    GenerateAvatarVideoRequest,
    RobotDashboardResponse,
    TwinBriefingResponse,
    TwinMessageRequest,
    TwinMessageResponse,
    TwinPostRequest,
    TwinVideoPostRequest,
    UploadAvatarRequest,
)
from services.robot_agent.application.services import RobotAgentService
from services.robot_agent.infrastructure.config import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(service=settings.service_name)


@router.get("/twins", response_model=ApiResponse[list[DigitalTwinResponse]])
async def list_twins(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[list[DigitalTwinResponse]]:
    twins = await service.list_twins(owner_id=user_id)
    return ApiResponse(data=twins)


@router.post("/twins", response_model=ApiResponse[DigitalTwinResponse])
async def create_twin(
    request: CreateTwinRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[DigitalTwinResponse]:
    twin = await service.create_twin(user_id, request)
    return ApiResponse(data=twin)


@router.post("/twins/{agent_id}/activate", response_model=ApiResponse[DigitalTwinResponse])
async def activate_twin(
    agent_id: str,
    request: ActivateTwinRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[DigitalTwinResponse]:
    twin = await service.activate_twin(user_id, agent_id, request)
    return ApiResponse(data=twin)


@router.post("/twins/{agent_id}/deactivate", response_model=ApiResponse[DigitalTwinResponse])
async def deactivate_twin(
    agent_id: str,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[DigitalTwinResponse]:
    twin = await service.deactivate_twin(user_id, agent_id)
    return ApiResponse(data=twin)


@router.post("/twins/{agent_id}/messages", response_model=ApiResponse[TwinMessageResponse])
async def send_twin_message(
    agent_id: str,
    request: TwinMessageRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[TwinMessageResponse]:
    msg = await service.receive_message(agent_id, request, from_user_id=user_id)
    return ApiResponse(data=msg)


@router.post("/twins/{agent_id}/post", response_model=ApiResponse[dict])
async def twin_post(
    agent_id: str,
    request: TwinPostRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    token: Annotated[str, Depends(get_token)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[dict]:
    post = await service.twin_post(user_id, agent_id, request, token)
    return ApiResponse(data=post)


@router.post("/twins/{agent_id}/avatar", response_model=ApiResponse[DigitalTwinResponse])
async def upload_twin_avatar(
    agent_id: str,
    request: UploadAvatarRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[DigitalTwinResponse]:
    twin = await service.upload_avatar(user_id, agent_id, request)
    return ApiResponse(data=twin)


@router.post("/twins/{agent_id}/avatar/video", response_model=ApiResponse[AvatarVideoResponse])
async def generate_twin_avatar_video(
    agent_id: str,
    request: GenerateAvatarVideoRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[AvatarVideoResponse]:
    result = await service.generate_avatar_video(user_id, agent_id, request)
    return ApiResponse(data=result)


@router.post("/twins/{agent_id}/video-post", response_model=ApiResponse[dict])
async def twin_video_post(
    agent_id: str,
    request: TwinVideoPostRequest,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    token: Annotated[str, Depends(get_token)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[dict]:
    post = await service.twin_video_post(user_id, agent_id, request, token)
    return ApiResponse(data=post)


@router.get("/twins/{agent_id}/briefing", response_model=ApiResponse[TwinBriefingResponse])
async def twin_briefing(
    agent_id: str,
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[RobotAgentService, Depends(get_robot_service)],
) -> ApiResponse[TwinBriefingResponse]:
    briefing = await service.get_briefing(user_id, agent_id)
    return ApiResponse(data=briefing)


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