import secrets
from uuid import UUID, uuid4

import httpx
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.robot_agent.application.dtos import (
    CommandRequest,
    CommandResponse,
    CreateTwinRequest,
    DigitalTwinResponse,
    RobotDashboardResponse,
)
from services.robot_agent.infrastructure.config import Settings
from services.robot_agent.infrastructure.models import CommandLogModel, DigitalTwinModel

DANGEROUS_COMMANDS = {"override_safety", "disable_limits", "force_move", "raw_actuator"}


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
        twin = DigitalTwinModel(
            id=uuid4(),
            agent_id=agent_id,
            owner_id=owner_id,
            name=request.name,
            status="standby",
            capabilities=request.capabilities,
        )
        self.db.add(twin)
        await self.db.commit()
        await self.db.refresh(twin)
        return self._to_twin(twin)

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
            # Verify via safety service
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
        twins = await self.list_twins(owner_id=None)
        recent = await self.db.execute(
            select(CommandLogModel)
            .where(CommandLogModel.issued_by == user_id)
            .order_by(CommandLogModel.created_at.desc())
            .limit(10)
        )
        logs = recent.scalars().all()
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
        )