from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from nexus_common.domain.models import ApiResponse, HealthResponse

from services.collaboration.api.deps import (
    AuthContext,
    get_auth_context,
    get_collaboration_service,
    get_settings,
    get_token,
)
from services.collaboration.application.dtos import (
    CallResponse,
    ContactResponse,
    CreateContactRequest,
    CreateMeetingRequest,
    CreatePodcastEpisodeRequest,
    CreateStatusRequest,
    CreateTeamRequest,
    MeetingResponse,
    PodcastEpisodeResponse,
    ShareRequest,
    ShareResponse,
    StartCallRequest,
    StatusResponse,
    TeamMemberResponse,
    TeamResponse,
)
from services.collaboration.application.services import CollaborationService
from services.collaboration.infrastructure.config import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(service=settings.service_name)


@router.post("/teams", response_model=ApiResponse[TeamResponse])
async def create_team(
    request: CreateTeamRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[TeamResponse]:
    return ApiResponse(data=await service.create_team(auth.user_id, auth.display_name, request))


@router.get("/teams", response_model=ApiResponse[list[TeamResponse]])
async def list_teams(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[list[TeamResponse]]:
    return ApiResponse(data=await service.list_teams(auth.user_id))


@router.get("/teams/{team_id}/members", response_model=ApiResponse[list[TeamMemberResponse]])
async def team_members(
    team_id: UUID,
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[list[TeamMemberResponse]]:
    return ApiResponse(data=await service.team_members(team_id))


@router.post("/meetings", response_model=ApiResponse[MeetingResponse])
async def create_meeting(
    request: CreateMeetingRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[MeetingResponse]:
    return ApiResponse(data=await service.create_meeting(auth.user_id, auth.display_name, request))


@router.get("/meetings", response_model=ApiResponse[list[MeetingResponse]])
async def my_meetings(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[list[MeetingResponse]]:
    return ApiResponse(data=await service.list_meetings(auth.user_id))


@router.get("/meetings/upcoming", response_model=ApiResponse[list[MeetingResponse]])
async def upcoming_meetings(
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[list[MeetingResponse]]:
    return ApiResponse(data=await service.upcoming_meetings())


@router.post("/calls", response_model=ApiResponse[CallResponse])
async def start_call(
    request: StartCallRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[CallResponse]:
    return ApiResponse(data=await service.start_call(auth.user_id, auth.display_name, request))


@router.get("/calls/recent", response_model=ApiResponse[list[CallResponse]])
async def recent_calls(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[list[CallResponse]]:
    return ApiResponse(data=await service.recent_calls(auth.user_id))


@router.post("/calls/{call_id}/answer", response_model=ApiResponse[CallResponse])
async def answer_call(
    call_id: UUID,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[CallResponse]:
    return ApiResponse(data=await service.answer_call(auth.user_id, call_id))


@router.post("/calls/{call_id}/end", response_model=ApiResponse[CallResponse])
async def end_call(
    call_id: UUID,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[CallResponse]:
    return ApiResponse(data=await service.end_call(auth.user_id, call_id))


@router.post("/status", response_model=ApiResponse[StatusResponse])
async def post_status(
    request: CreateStatusRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[StatusResponse]:
    return ApiResponse(data=await service.post_status(auth.user_id, auth.display_name, request))


@router.get("/status/feed", response_model=ApiResponse[list[StatusResponse]])
async def status_feed(
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[list[StatusResponse]]:
    return ApiResponse(data=await service.status_feed())


@router.get("/status/me", response_model=ApiResponse[StatusResponse | None])
async def my_status(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[StatusResponse | None]:
    return ApiResponse(data=await service.my_status(auth.user_id))


@router.get("/contacts", response_model=ApiResponse[list[ContactResponse]])
async def list_contacts(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    token: Annotated[str, Depends(get_token)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
    sync: bool = Query(default=True),
) -> ApiResponse[list[ContactResponse]]:
    if sync:
        data = await service.sync_connection_contacts(auth.user_id, token)
    else:
        data = await service.list_contacts(auth.user_id)
    return ApiResponse(data=data)


@router.post("/contacts", response_model=ApiResponse[ContactResponse])
async def add_contact(
    request: CreateContactRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[ContactResponse]:
    return ApiResponse(data=await service.add_contact(auth.user_id, request))


@router.post("/share", response_model=ApiResponse[ShareResponse])
async def share_content(
    request: ShareRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[ShareResponse]:
    return ApiResponse(data=await service.share_with_contacts(auth.user_id, auth.display_name, request))


@router.post("/podcast/episodes", response_model=ApiResponse[PodcastEpisodeResponse])
async def create_episode(
    request: CreatePodcastEpisodeRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
) -> ApiResponse[PodcastEpisodeResponse]:
    return ApiResponse(data=await service.create_podcast_episode(auth.user_id, request))


@router.get("/podcast/episodes", response_model=ApiResponse[list[PodcastEpisodeResponse]])
async def list_episodes(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[CollaborationService, Depends(get_collaboration_service)],
    type: str | None = Query(default=None, alias="type"),
) -> ApiResponse[list[PodcastEpisodeResponse]]:
    return ApiResponse(data=await service.list_podcast_episodes(auth.user_id, type))