import secrets
from uuid import UUID, uuid4

import httpx
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from services.robot_agent.application.avatar_engine import AvatarEngine
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
from services.robot_agent.infrastructure.config import Settings
from services.robot_agent.infrastructure.models import (
    CommandLogModel,
    DigitalTwinModel,
    TwinActivityModel,
    TwinMessageModel,
)

DANGEROUS_COMMANDS = {"override_safety", "disable_limits", "force_move", "raw_actuator"}


def _default_greeting(owner: str, twin_name: str) -> str:
    return (
        f"Hi — I'm the digital twin of {owner}. {owner} is busy right now, "
        f"but I'm here to help answer your questions and pass messages along."
    )


class RobotAgentService:
    def __init__(self, db: AsyncSession, settings: Settings):
        self.db = db
        self.settings = settings

    async def list_twins(self, owner_id: UUID | None = None) -> list[DigitalTwinResponse]:
        query = select(DigitalTwinModel)
        if owner_id:
            query = query.where(DigitalTwinModel.owner_id == owner_id)
        result = await self.db.execute(query)
        return [self._to_twin(t) for t in result.scalars().all()]

    async def create_twin(self, owner_id: UUID, request: CreateTwinRequest) -> DigitalTwinResponse:
        agent_id = f"twin-{secrets.token_hex(4)}"
        owner_name = request.owner_display_name or "User"
        twin = DigitalTwinModel(
            id=uuid4(),
            agent_id=agent_id,
            owner_id=owner_id,
            name=request.name,
            status="standby",
            capabilities=request.capabilities or "posting,messaging,voice",
            owner_display_name=owner_name,
            persona_greeting=_default_greeting(owner_name, request.name),
            is_active=False,
        )
        self.db.add(twin)
        await self.db.commit()
        await self.db.refresh(twin)
        return self._to_twin(twin)

    async def activate_twin(
        self, owner_id: UUID, agent_id: str, request: ActivateTwinRequest
    ) -> DigitalTwinResponse:
        twin = await self._get_owned_twin(owner_id, agent_id)
        await self.db.execute(
            select(DigitalTwinModel).where(DigitalTwinModel.owner_id == owner_id)
        )
        all_twins = await self.db.execute(
            select(DigitalTwinModel).where(DigitalTwinModel.owner_id == owner_id)
        )
        for t in all_twins.scalars().all():
            t.is_active = t.agent_id == agent_id
            t.status = "online" if t.agent_id == agent_id else "standby"
            t.social_status = "representing" if t.agent_id == agent_id else "available"

        twin.owner_display_name = request.owner_display_name
        twin.persona_greeting = _default_greeting(request.owner_display_name, twin.name)
        await self._log_activity(agent_id, "activated", f"{request.owner_display_name} went busy — twin now representing")
        await self.db.commit()
        await self.db.refresh(twin)
        return self._to_twin(twin)

    async def upload_avatar(
        self, owner_id: UUID, agent_id: str, request: UploadAvatarRequest
    ) -> DigitalTwinResponse:
        twin = await self._get_owned_twin(owner_id, agent_id)
        image = request.image_data.strip()
        if not image.startswith("data:image/"):
            raise HTTPException(status_code=400, detail="Upload a valid image (JPEG/PNG)")
        twin.avatar_image = image[:500_000]
        twin.avatar_provider = "uploaded"
        await self._log_activity(agent_id, "avatar", "Avatar photo uploaded for talking-head")
        await self.db.commit()
        await self.db.refresh(twin)
        return self._to_twin(twin)

    async def generate_avatar_video(
        self, owner_id: UUID, agent_id: str, request: GenerateAvatarVideoRequest
    ) -> AvatarVideoResponse:
        twin = await self._get_owned_twin(owner_id, agent_id)
        if not twin.avatar_image:
            raise HTTPException(status_code=400, detail="Upload or capture your photo first")

        engine = AvatarEngine(did_api_key=self.settings.did_api_key, did_api_url=self.settings.did_api_url)
        result = await engine.generate(twin.avatar_image, request.script, request.voice_id)

        twin.avatar_script = request.script
        twin.avatar_provider = result.get("provider")
        if result.get("video_url"):
            twin.avatar_video_url = result["video_url"]
        await self._log_activity(agent_id, "avatar_video", f"Talking avatar: {request.script[:60]}")
        await self.db.commit()
        await self.db.refresh(twin)

        return AvatarVideoResponse(
            agent_id=agent_id,
            provider=result.get("provider", "nexsocio-lipsync"),
            talk_id=result.get("talk_id", ""),
            video_url=result.get("video_url"),
            avatar_image=result.get("avatar_image") or twin.avatar_image[:500],
            script=request.script,
            status=result.get("status", "ready"),
            instructions=result.get("instructions"),
        )

    async def twin_video_post(
        self, owner_id: UUID, agent_id: str, request: TwinVideoPostRequest, token: str
    ) -> dict:
        twin = await self._get_owned_twin(owner_id, agent_id)
        owner = twin.owner_display_name or "User"
        body = (
            f"🤖 Digital twin of {owner} — {owner} is busy right now.\n\n"
            f"{request.script}"
        )
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f"{self.settings.content_service_url}/api/v1/posts",
                    headers={"Authorization": f"Bearer {token}"},
                    json={
                        "body": body,
                        "context": request.context,
                        "is_twin_post": True,
                        "twin_agent_id": agent_id,
                        "owner_display_name": owner,
                        "post_type": "reel",
                        "media_url": request.video_url[:500_000],
                        "ai_assisted": request.ai_assisted,
                        "hide_ai_tag": request.hide_ai_tag,
                    },
                )
                if res.status_code not in (200, 201):
                    raise HTTPException(status_code=502, detail="Failed to publish twin video")
                data = res.json().get("data", {})
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail="Content service unavailable") from e

        twin.avatar_video_url = request.video_url[:500_000]
        await self._log_activity(agent_id, "post", f"AI talking video for {owner}")
        await self.db.commit()
        return data

    async def deactivate_twin(self, owner_id: UUID, agent_id: str) -> DigitalTwinResponse:
        twin = await self._get_owned_twin(owner_id, agent_id)
        twin.is_active = False
        twin.status = "standby"
        twin.social_status = "available"
        await self._log_activity(agent_id, "deactivated", f"{twin.owner_display_name or 'Owner'} is back online")
        await self.db.commit()
        await self.db.refresh(twin)
        return self._to_twin(twin)

    async def receive_message(
        self, agent_id: str, request: TwinMessageRequest, from_user_id: UUID | None = None
    ) -> TwinMessageResponse:
        twin = await self._get_twin(agent_id)
        if not twin.is_active:
            raise HTTPException(status_code=400, detail="This digital twin is not currently representing its owner")

        msg = TwinMessageModel(
            id=uuid4(),
            twin_agent_id=agent_id,
            from_user_id=from_user_id,
            from_name=request.from_name,
            body=request.body,
            direction="inbound",
        )
        self.db.add(msg)

        reply = TwinMessageModel(
            id=uuid4(),
            twin_agent_id=agent_id,
            from_user_id=None,
            from_name=twin.name,
            body=(
                f"Thanks {request.from_name}! I've noted your message for "
                f"{twin.owner_display_name or 'the owner'}. They'll see this when they're back."
            ),
            direction="outbound",
        )
        self.db.add(reply)
        await self._log_activity(
            agent_id, "message", f"Message from {request.from_name}: {request.body[:80]}"
        )
        await self.db.commit()
        await self.db.refresh(msg)
        return self._to_message(msg)

    async def twin_post(
        self, owner_id: UUID, agent_id: str, request: TwinPostRequest, token: str
    ) -> dict:
        twin = await self._get_owned_twin(owner_id, agent_id)
        if not twin.is_active:
            raise HTTPException(status_code=400, detail="Activate your twin before posting")

        owner = twin.owner_display_name or "User"
        prefixed = (
            f"🤖 Digital twin of {owner} — {owner} is busy right now. "
            f"I'm here to help.\n\n{request.body}"
        )
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.settings.content_service_url}/api/v1/posts",
                    headers={"Authorization": f"Bearer {token}"},
                    json={
                        "body": prefixed,
                        "context": request.context,
                        "is_twin_post": True,
                        "twin_agent_id": agent_id,
                        "owner_display_name": owner,
                        "post_type": "text",
                    },
                )
                if res.status_code not in (200, 201):
                    raise HTTPException(status_code=502, detail="Failed to publish twin post")
                data = res.json().get("data", {})
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail="Content service unavailable") from e

        await self._log_activity(agent_id, "post", f"Posted on behalf of {owner}: {request.body[:60]}")
        await self.db.commit()
        return data

    async def get_briefing(self, owner_id: UUID, agent_id: str) -> TwinBriefingResponse:
        twin = await self._get_owned_twin(owner_id, agent_id)
        msgs = await self.db.execute(
            select(TwinMessageModel)
            .where(TwinMessageModel.twin_agent_id == agent_id)
            .order_by(TwinMessageModel.created_at.desc())
            .limit(20)
        )
        messages = [self._to_message(m) for m in msgs.scalars().all()]

        acts = await self.db.execute(
            select(TwinActivityModel)
            .where(TwinActivityModel.twin_agent_id == agent_id)
            .order_by(TwinActivityModel.created_at.desc())
            .limit(15)
        )
        activities = [
            {"type": a.activity_type, "summary": a.summary, "at": a.created_at.isoformat()}
            for a in acts.scalars().all()
        ]

        inbound = sum(1 for m in messages if m.direction == "inbound")
        posts = sum(1 for a in activities if a["type"] == "post")
        owner = twin.owner_display_name or "you"

        voice_summary = (
            f"Welcome back, {owner}. While you were away, your twin {twin.name} "
            f"handled {inbound} message{'s' if inbound != 1 else ''} and made {posts} post{'s' if posts != 1 else ''}. "
            f"Say 'read messages' for details."
        )

        return TwinBriefingResponse(
            agent_id=agent_id,
            twin_name=twin.name,
            owner_display_name=owner,
            greeting=twin.persona_greeting or _default_greeting(owner, twin.name),
            message_count=inbound,
            post_count=posts,
            activities=activities,
            messages=messages,
            voice_summary=voice_summary,
        )

    async def issue_command(
        self, user_id: UUID, request: CommandRequest, token: str
    ) -> CommandResponse:
        cmd = request.command.lower().strip()

        if cmd in DANGEROUS_COMMANDS:
            safety_check = "rejected"
            message = "Command blocked by safety policy"
            status = "rejected"
        elif cmd not in self.settings.allowed_commands:
            safety_check = "rejected"
            message = f"Command '{cmd}' not in certified allowlist"
            status = "rejected"
        else:
            safety_check = await self._safety_verify(cmd, token)
            if safety_check == "passed":
                status = "accepted"
                message = f"Command '{cmd}' accepted on safety channel"
            else:
                status = "rejected"
                message = "Safety service rejected command"

        log = CommandLogModel(
            id=uuid4(),
            agent_id=request.agent_id,
            command=cmd,
            safety_check=safety_check,
            issued_by=user_id,
        )
        self.db.add(log)
        await self.db.commit()

        return CommandResponse(
            agent_id=request.agent_id,
            command=cmd,
            status=status,
            safety_check=safety_check,
            message=message,
        )

    async def get_dashboard(self, user_id: UUID) -> RobotDashboardResponse:
        twins = await self.list_twins(owner_id=user_id)
        recent = await self.db.execute(
            select(CommandLogModel)
            .where(CommandLogModel.issued_by == user_id)
            .order_by(CommandLogModel.created_at.desc())
            .limit(10)
        )
        logs = recent.scalars().all()
        active = next((t for t in twins if t.is_active), None)
        return RobotDashboardResponse(
            twins=twins,
            recent_commands=[
                {
                    "agent_id": l.agent_id,
                    "command": l.command,
                    "safety_check": l.safety_check,
                    "created_at": l.created_at.isoformat(),
                }
                for l in logs
            ],
            safety_channel_status="certified_stub_v1 — operational",
            active_twin=active,
        )

    async def _get_twin(self, agent_id: str) -> DigitalTwinModel:
        result = await self.db.execute(
            select(DigitalTwinModel).where(DigitalTwinModel.agent_id == agent_id)
        )
        twin = result.scalar_one_or_none()
        if not twin:
            raise HTTPException(status_code=404, detail="Digital twin not found")
        return twin

    async def _get_owned_twin(self, owner_id: UUID, agent_id: str) -> DigitalTwinModel:
        twin = await self._get_twin(agent_id)
        if twin.owner_id != owner_id:
            raise HTTPException(status_code=403, detail="Not your digital twin")
        return twin

    async def _log_activity(self, agent_id: str, activity_type: str, summary: str) -> None:
        self.db.add(
            TwinActivityModel(
                id=uuid4(),
                twin_agent_id=agent_id,
                activity_type=activity_type,
                summary=summary,
            )
        )

    async def _safety_verify(self, command: str, token: str) -> str:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    f"{self.settings.safety_service_url}/api/v1/moderate",
                    json={"text": f"robot command: {command}", "author_mode": "prime"},
                )
                if res.status_code == 200:
                    data = res.json().get("data", {})
                    return "passed" if data.get("allowed") else "failed"
        except httpx.HTTPError:
            pass
        return "passed_stub"

    def _to_twin(self, twin: DigitalTwinModel) -> DigitalTwinResponse:
        return DigitalTwinResponse(
            agent_id=twin.agent_id,
            name=twin.name,
            status=twin.status,
            safety_channel=twin.safety_channel,
            social_status=twin.social_status,
            capabilities=twin.capabilities,
            owner_id=twin.owner_id,
            owner_display_name=twin.owner_display_name,
            persona_greeting=twin.persona_greeting,
            is_active=twin.is_active,
            avatar_image=twin.avatar_image,
            avatar_video_url=twin.avatar_video_url,
            avatar_script=twin.avatar_script,
            avatar_provider=twin.avatar_provider,
        )

    def _to_message(self, msg: TwinMessageModel) -> TwinMessageResponse:
        return TwinMessageResponse(
            id=msg.id,
            twin_agent_id=msg.twin_agent_id,
            from_name=msg.from_name,
            body=msg.body,
            direction=msg.direction,
            created_at=msg.created_at,
        )