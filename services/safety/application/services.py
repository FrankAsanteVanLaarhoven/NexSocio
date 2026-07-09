from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.safety.moderation import ModerationEngine
from nexus_common.security.rate_limit import RateLimiter
from services.safety.application.dtos import (
    ModerateRequest,
    ModerationResponse,
    ReportRequest,
    ReportResponse,
    SafetyDashboardResponse,
)
from services.safety.infrastructure.models import ContentReportModel, ModerationEventModel


class SafetyService:
    def __init__(self, db: AsyncSession, rate_limiter: RateLimiter | None = None):
        self.db = db
        self.engine = ModerationEngine()
        self.limiter = rate_limiter or RateLimiter(requests_per_minute=120)

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