import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import httpx
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

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
from services.collaboration.infrastructure.config import Settings
from services.collaboration.infrastructure.models import (
    CallSessionModel,
    ContactModel,
    MeetingModel,
    PodcastEpisodeModel,
    StatusUpdateModel,
    TeamMemberModel,
    TeamModel,
)


def _room_code() -> str:
    return secrets.token_hex(4).upper()


class CollaborationService:
    def __init__(self, db: AsyncSession, settings: Settings):
        self.db = db
        self.settings = settings

    async def create_team(self, user_id: UUID, display_name: str, req: CreateTeamRequest) -> TeamResponse:
        team = TeamModel(id=uuid4(), name=req.name, owner_id=user_id, sector=req.sector)
        self.db.add(team)
        self.db.add(
            TeamMemberModel(team_id=team.id, user_id=user_id, display_name=display_name, role="owner")
        )
        await self.db.commit()
        await self.db.refresh(team)
        return await self._team(team, 1)

    async def list_teams(self, user_id: UUID) -> list[TeamResponse]:
        result = await self.db.execute(
            select(TeamModel)
            .join(TeamMemberModel, TeamMemberModel.team_id == TeamModel.id)
            .where(TeamMemberModel.user_id == user_id)
            .order_by(TeamModel.created_at.desc())
        )
        teams = result.scalars().unique().all()
        out = []
        for t in teams:
            cnt = await self.db.execute(
                select(func.count()).select_from(TeamMemberModel).where(TeamMemberModel.team_id == t.id)
            )
            out.append(await self._team(t, cnt.scalar() or 0))
        return out

    async def team_members(self, team_id: UUID) -> list[TeamMemberResponse]:
        result = await self.db.execute(
            select(TeamMemberModel).where(TeamMemberModel.team_id == team_id)
        )
        return [
            TeamMemberResponse(user_id=m.user_id, display_name=m.display_name, role=m.role)
            for m in result.scalars().all()
        ]

    async def create_meeting(
        self, user_id: UUID, display_name: str, req: CreateMeetingRequest
    ) -> MeetingResponse:
        meeting = MeetingModel(
            id=uuid4(),
            team_id=req.team_id,
            host_id=user_id,
            host_name=display_name,
            title=req.title,
            scheduled_at=req.scheduled_at,
            duration_min=req.duration_min,
            room_code=_room_code(),
        )
        self.db.add(meeting)
        await self.db.commit()
        await self.db.refresh(meeting)
        return self._meeting(meeting)

    async def list_meetings(self, user_id: UUID) -> list[MeetingResponse]:
        result = await self.db.execute(
            select(MeetingModel)
            .where(MeetingModel.host_id == user_id)
            .order_by(MeetingModel.scheduled_at.desc())
            .limit(50)
        )
        return [self._meeting(m) for m in result.scalars().all()]

    async def upcoming_meetings(self) -> list[MeetingResponse]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(MeetingModel)
            .where(MeetingModel.scheduled_at >= now, MeetingModel.status == "scheduled")
            .order_by(MeetingModel.scheduled_at.asc())
            .limit(30)
        )
        return [self._meeting(m) for m in result.scalars().all()]

    async def start_call(
        self, user_id: UUID, display_name: str, req: StartCallRequest
    ) -> CallResponse:
        call = CallSessionModel(
            id=uuid4(),
            caller_id=user_id,
            caller_name=display_name,
            callee_id=req.callee_id,
            callee_name=req.callee_name,
            call_type=req.call_type,
            room_code=_room_code(),
            status="ringing",
        )
        self.db.add(call)
        await self.db.commit()
        await self.db.refresh(call)
        await self._notify(req.callee_id, "call", f"Incoming {req.call_type} call", display_name)
        return self._call(call)

    async def recent_calls(self, user_id: UUID) -> list[CallResponse]:
        result = await self.db.execute(
            select(CallSessionModel)
            .where(
                (CallSessionModel.caller_id == user_id) | (CallSessionModel.callee_id == user_id)
            )
            .order_by(CallSessionModel.started_at.desc())
            .limit(30)
        )
        return [self._call(c) for c in result.scalars().all()]

    async def answer_call(self, user_id: UUID, call_id: UUID) -> CallResponse:
        call = await self._get_call(call_id)
        if call.callee_id != user_id:
            raise HTTPException(status_code=403, detail="Not callee")
        call.status = "active"
        await self.db.commit()
        await self.db.refresh(call)
        return self._call(call)

    async def end_call(self, user_id: UUID, call_id: UUID) -> CallResponse:
        call = await self._get_call(call_id)
        if user_id not in (call.caller_id, call.callee_id):
            raise HTTPException(status_code=403, detail="Not participant")
        call.status = "ended"
        call.ended_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(call)
        return self._call(call)

    async def post_status(
        self, user_id: UUID, display_name: str, req: CreateStatusRequest
    ) -> StatusResponse:
        expires = datetime.now(timezone.utc) + timedelta(hours=24)
        status = StatusUpdateModel(
            id=uuid4(),
            user_id=user_id,
            display_name=display_name,
            text=req.text,
            media_url=req.media_url,
            media_type=req.media_type,
            expires_at=expires,
        )
        self.db.add(status)
        await self.db.commit()
        await self.db.refresh(status)
        return self._status(status)

    async def status_feed(self) -> list[StatusResponse]:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(StatusUpdateModel)
            .where(StatusUpdateModel.expires_at > now)
            .order_by(StatusUpdateModel.created_at.desc())
            .limit(50)
        )
        return [self._status(s) for s in result.scalars().all()]

    async def my_status(self, user_id: UUID) -> StatusResponse | None:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(StatusUpdateModel)
            .where(StatusUpdateModel.user_id == user_id, StatusUpdateModel.expires_at > now)
            .order_by(StatusUpdateModel.created_at.desc())
            .limit(1)
        )
        s = result.scalar_one_or_none()
        return self._status(s) if s else None

    async def list_contacts(self, user_id: UUID) -> list[ContactResponse]:
        result = await self.db.execute(
            select(ContactModel)
            .where(ContactModel.owner_id == user_id)
            .order_by(ContactModel.display_name.asc())
        )
        return [self._contact(c) for c in result.scalars().all()]

    async def add_contact(self, user_id: UUID, req: CreateContactRequest) -> ContactResponse:
        contact = ContactModel(
            id=uuid4(),
            owner_id=user_id,
            contact_user_id=req.contact_user_id,
            display_name=req.display_name,
            email=req.email,
            phone=req.phone,
            source="manual" if not req.contact_user_id else "connection",
        )
        self.db.add(contact)
        await self.db.commit()
        await self.db.refresh(contact)
        return self._contact(contact)

    async def sync_connection_contacts(
        self, user_id: UUID, token: str
    ) -> list[ContactResponse]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    f"{self.settings.social_graph_service_url}/api/v1/connections",
                    headers={"Authorization": f"Bearer {token}"},
                )
                if res.status_code != 200:
                    return await self.list_contacts(user_id)
                data = res.json().get("data", {})
                for conn in data.get("connections", []):
                    if conn.get("status") != "accepted":
                        continue
                    other_id = conn.get("other_user_id")
                    other_name = conn.get("other_display_name", "Member")
                    if not other_id:
                        continue
                    existing = await self.db.execute(
                        select(ContactModel).where(
                            ContactModel.owner_id == user_id,
                            ContactModel.contact_user_id == UUID(other_id),
                        )
                    )
                    if existing.scalar_one_or_none():
                        continue
                    self.db.add(
                        ContactModel(
                            id=uuid4(),
                            owner_id=user_id,
                            contact_user_id=UUID(other_id),
                            display_name=other_name,
                            source="connection",
                        )
                    )
                await self.db.commit()
        except httpx.HTTPError:
            pass
        return await self.list_contacts(user_id)

    async def share_with_contacts(
        self, user_id: UUID, display_name: str, req: ShareRequest
    ) -> ShareResponse:
        result = await self.db.execute(
            select(ContactModel).where(
                ContactModel.owner_id == user_id,
                ContactModel.id.in_(req.contact_ids),
            )
        )
        contacts = result.scalars().all()
        if not contacts:
            raise HTTPException(status_code=400, detail="No valid contacts selected")
        for c in contacts:
            if c.contact_user_id:
                await self._notify(
                    c.contact_user_id,
                    "share",
                    f"{display_name} shared {req.content_type}",
                    req.message[:200],
                )
        return ShareResponse(
            shared_count=len(contacts),
            contact_ids=[c.id for c in contacts],
        )

    async def create_podcast_episode(
        self, user_id: UUID, req: CreatePodcastEpisodeRequest
    ) -> PodcastEpisodeResponse:
        ep = PodcastEpisodeModel(
            id=uuid4(),
            user_id=user_id,
            title=req.title,
            description=req.description,
            media_url=req.media_url,
            episode_type=req.episode_type,
            published_at=datetime.now(timezone.utc) if req.publish else None,
        )
        self.db.add(ep)
        await self.db.commit()
        await self.db.refresh(ep)
        return self._episode(ep)

    async def list_podcast_episodes(
        self, user_id: UUID, episode_type: str | None = None
    ) -> list[PodcastEpisodeResponse]:
        q = select(PodcastEpisodeModel).where(PodcastEpisodeModel.user_id == user_id)
        if episode_type:
            q = q.where(PodcastEpisodeModel.episode_type == episode_type)
        q = q.order_by(PodcastEpisodeModel.created_at.desc()).limit(50)
        result = await self.db.execute(q)
        return [self._episode(e) for e in result.scalars().all()]

    async def _notify(self, user_id: UUID, ntype: str, title: str, body: str) -> None:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(
                    f"{self.settings.notification_service_url}/api/v1/notifications",
                    json={
                        "user_id": str(user_id),
                        "type": ntype,
                        "title": title,
                        "body": body,
                    },
                )
        except httpx.HTTPError:
            pass

    async def verify_meeting_room(self, user_id: UUID, room_code: str) -> MeetingModel:
        result = await self.db.execute(
            select(MeetingModel).where(
                MeetingModel.room_code == room_code.upper(),
                MeetingModel.status == "scheduled",
            )
        )
        meeting = result.scalar_one_or_none()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting room not found or ended")
        return meeting

    async def verify_call_room(self, user_id: UUID, room_code: str) -> CallSessionModel:
        result = await self.db.execute(
            select(CallSessionModel).where(
                CallSessionModel.room_code == room_code,
                CallSessionModel.status.in_(["ringing", "active"]),
            )
        )
        call = result.scalar_one_or_none()
        if not call:
            raise HTTPException(status_code=404, detail="Call room not found or ended")
        if user_id not in (call.caller_id, call.callee_id):
            raise HTTPException(status_code=403, detail="Not a call participant")
        return call

    async def _get_call(self, call_id: UUID) -> CallSessionModel:
        result = await self.db.execute(
            select(CallSessionModel).where(CallSessionModel.id == call_id)
        )
        call = result.scalar_one_or_none()
        if not call:
            raise HTTPException(status_code=404, detail="Call not found")
        return call

    async def _team(self, t: TeamModel, count: int) -> TeamResponse:
        return TeamResponse(
            id=t.id, name=t.name, owner_id=t.owner_id, sector=t.sector,
            member_count=count, created_at=t.created_at,
        )

    def _meeting(self, m: MeetingModel) -> MeetingResponse:
        return MeetingResponse(
            id=m.id, team_id=m.team_id, host_id=m.host_id, host_name=m.host_name,
            title=m.title, scheduled_at=m.scheduled_at, duration_min=m.duration_min,
            room_code=m.room_code, status=m.status, created_at=m.created_at,
        )

    def _call(self, c: CallSessionModel) -> CallResponse:
        return CallResponse(
            id=c.id, caller_id=c.caller_id, caller_name=c.caller_name,
            callee_id=c.callee_id, callee_name=c.callee_name, call_type=c.call_type,
            status=c.status, room_code=c.room_code, started_at=c.started_at, ended_at=c.ended_at,
        )

    def _status(self, s: StatusUpdateModel) -> StatusResponse:
        return StatusResponse(
            id=s.id, user_id=s.user_id, display_name=s.display_name, text=s.text,
            media_url=s.media_url, media_type=s.media_type,
            expires_at=s.expires_at, created_at=s.created_at,
        )

    def _contact(self, c: ContactModel) -> ContactResponse:
        return ContactResponse(
            id=c.id, contact_user_id=c.contact_user_id, display_name=c.display_name,
            email=c.email, phone=c.phone, source=c.source, created_at=c.created_at,
        )

    def _episode(self, e: PodcastEpisodeModel) -> PodcastEpisodeResponse:
        return PodcastEpisodeResponse(
            id=e.id, user_id=e.user_id, title=e.title, description=e.description,
            media_url=e.media_url, episode_type=e.episode_type,
            published_at=e.published_at, created_at=e.created_at,
        )