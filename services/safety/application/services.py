from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.safety.moderation import ModerationEngine
from nexus_common.security.rate_limit import RateLimiter
import httpx
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
from services.safety.infrastructure.models import (
    ContentReportModel,
    ModerationEventModel,
    ModeratorActionLogModel,
    SafetyPolicyModel,
)


class SafetyService:
    def __init__(self, db: AsyncSession, rate_limiter: RateLimiter | None = None, content_url: str = "http://localhost:8003"):
        self.db = db
        self.engine = ModerationEngine()
        self.limiter = rate_limiter or RateLimiter(requests_per_minute=120)
        self.content_url = content_url

    async def moderate(self, request: ModerateRequest) -> ModerationResponse:
        result = self.engine.analyze(request.text, request.author_mode)
        event = ModerationEventModel(
            id=uuid4(),
            content_id=request.content_id,
            content_body=request.text[:500],
            action=result.action,
            score=f"{result.score:.2f}",
            labels=",".join(result.labels),
            status="resolved" if result.allowed else "blocked",
        )
        self.db.add(event)
        await self.db.commit()
        return ModerationResponse(
            allowed=result.allowed,
            score=result.score,
            labels=result.labels,
            action=result.action,
            message=result.message,
        )

    async def report_content(
        self, reporter_id: UUID, request: ReportRequest
    ) -> ReportResponse:
        if not self.limiter.allow(f"report:{reporter_id}"):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        report = ContentReportModel(
            id=uuid4(),
            post_id=request.post_id,
            reporter_id=reporter_id,
            reason=request.reason,
            details=request.details,
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return ReportResponse(
            id=report.id,
            post_id=report.post_id,
            status=report.status,
            created_at=report.created_at,
        )

    async def get_dashboard(self) -> SafetyDashboardResponse:
        total = await self.db.execute(select(func.count()).select_from(ModerationEventModel))
        blocked = await self.db.execute(
            select(func.count()).select_from(ModerationEventModel).where(
                ModerationEventModel.action == "block"
            )
        )
        review = await self.db.execute(
            select(func.count()).select_from(ModerationEventModel).where(
                ModerationEventModel.action == "review"
            )
        )
        open_reports = await self.db.execute(
            select(func.count()).select_from(ContentReportModel).where(
                ContentReportModel.status == "open"
            )
        )
        recent = await self.db.execute(
            select(ModerationEventModel).order_by(ModerationEventModel.created_at.desc()).limit(10)
        )
        events = recent.scalars().all()
        total_n = total.scalar() or 0
        blocked_n = blocked.scalar() or 0

        return SafetyDashboardResponse(
            total_events=total_n,
            blocked_count=blocked_n,
            review_count=review.scalar() or 0,
            open_reports=open_reports.scalar() or 0,
            incident_rate=round(blocked_n / max(total_n, 1) * 100, 2),
            recent_events=[
                {
                    "id": str(e.id),
                    "action": e.action,
                    "score": e.score,
                    "labels": e.labels,
                    "status": e.status,
                    "created_at": e.created_at.isoformat(),
                }
                for e in events
            ],
        )

    async def list_reports_admin(self) -> list[ContentReportResponse]:
        result = await self.db.execute(
            select(ContentReportModel).order_by(ContentReportModel.created_at.desc())
        )
        reports = result.scalars().all()
        return [
            ContentReportResponse(
                id=r.id,
                post_id=r.post_id,
                reporter_id=r.reporter_id,
                reason=r.reason,
                details=r.details,
                status=r.status,
                created_at=r.created_at,
            )
            for r in reports
        ]

    async def moderate_report_action_admin(
        self,
        report_id: UUID,
        request: ReportActionRequest,
        moderator_id: UUID,
        moderator_name: str,
        token: str,
    ) -> bool:
        result = await self.db.execute(select(ContentReportModel).where(ContentReportModel.id == report_id))
        report = result.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")

        # 1. Update report status
        if request.action == "approve":
            report.status = "resolved"
        elif request.action == "remove":
            report.status = "removed"
            # 2. Call Content Service to hide the post
            async with httpx.AsyncClient() as client:
                res = await client.patch(
                    f"{self.content_url}/api/v1/admin/posts/{report.post_id}/moderation?status=removed",
                    headers={"Authorization": f"Bearer {token}"},
                )
                if res.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Content Service moderation update failed: {res.text}",
                    )
        else:
            raise HTTPException(status_code=400, detail="Invalid action")

        # 3. Log the moderator action
        log = ModeratorActionLogModel(
            id=uuid4(),
            moderator_id=moderator_id,
            moderator_name=moderator_name,
            target_type="post",
            target_id=report.post_id,
            action=f"{request.action}_post",
            reason=request.reason,
        )
        self.db.add(log)
        await self.db.commit()
        return True

    async def list_audit_logs_admin(self) -> list[ModeratorActionLogResponse]:
        result = await self.db.execute(
            select(ModeratorActionLogModel).order_by(ModeratorActionLogModel.created_at.desc())
        )
        logs = result.scalars().all()
        return [
            ModeratorActionLogResponse(
                id=l.id,
                moderator_id=l.moderator_id,
                moderator_name=l.moderator_name,
                target_type=l.target_type,
                target_id=l.target_id,
                action=l.action,
                reason=l.reason,
                created_at=l.created_at,
            )
            for l in logs
        ]

    async def list_policies_admin(self) -> list[SafetyPolicyResponse]:
        result = await self.db.execute(select(SafetyPolicyModel))
        policies = result.scalars().all()
        
        # Ensure default policies exist in database if they don't
        policy_dict = {p.key: p for p in policies}
        defaults = [
            ("emergency_mode", "false"),
            ("read_only_mode", "false")
        ]
        
        updated = False
        for key, def_val in defaults:
            if key not in policy_dict:
                pol = SafetyPolicyModel(
                    key=key,
                    value=def_val,
                    updated_by=UUID("00000000-0000-0000-0000-000000000000")
                )
                self.db.add(pol)
                policy_dict[key] = pol
                updated = True
        
        if updated:
            await self.db.commit()
            # Fetch again to populate audit fields correctly
            result = await self.db.execute(select(SafetyPolicyModel))
            policies = result.scalars().all()

        return [
            SafetyPolicyResponse(
                key=p.key,
                value=p.value,
                updated_by=p.updated_by,
                updated_at=p.updated_at,
            )
            for p in policies
        ]

    async def update_policy_admin(
        self, request: SafetyPolicyUpdateRequest, moderator_id: UUID, moderator_name: str
    ) -> SafetyPolicyResponse:
        result = await self.db.execute(
            select(SafetyPolicyModel).where(SafetyPolicyModel.key == request.key)
        )
        policy = result.scalar_one_or_none()
        if not policy:
            policy = SafetyPolicyModel(
                key=request.key,
                value=request.value,
                updated_by=moderator_id,
            )
            self.db.add(policy)
        else:
            policy.value = request.value
            policy.updated_by = moderator_id
        
        # Also log this configuration change as an audit trail log
        log = ModeratorActionLogModel(
            id=uuid4(),
            moderator_id=moderator_id,
            moderator_name=moderator_name,
            target_type="policy",
            target_id=UUID("00000000-0000-0000-0000-000000000000"),
            action=f"update_policy_{request.key}",
            reason=f"Policy updated to {request.value}",
        )
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(policy)
        
        return SafetyPolicyResponse(
            key=policy.key,
            value=policy.value,
            updated_by=policy.updated_by,
            updated_at=policy.updated_at,
        )