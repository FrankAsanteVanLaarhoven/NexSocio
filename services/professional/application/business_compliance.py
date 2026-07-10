"""Business tools subscription for SMEs and solo traders — marketplace selling gate."""

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.domain.business_tools import BUSINESS_TOOLS_MONTHLY_GBP, BUSINESS_TRIAL_DAYS
from services.professional.application.dtos import BusinessToolsAccess, BusinessToolsStatus
from services.professional.infrastructure.models import BusinessProfileModel, BusinessSubscriptionModel


class BusinessComplianceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _subscription(self, user_id: UUID) -> BusinessSubscriptionModel | None:
        result = await self.db.execute(
            select(BusinessSubscriptionModel).where(BusinessSubscriptionModel.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def _has_business_profile(self, user_id: UUID) -> bool:
        result = await self.db.execute(
            select(BusinessProfileModel).where(BusinessProfileModel.user_id == user_id)
        )
        return result.scalar_one_or_none() is not None

    def _status(self, user_id: UUID, sub: BusinessSubscriptionModel | None) -> BusinessToolsStatus:
        now = datetime.now(timezone.utc)
        trial_active = False
        tools_active = False
        trial_ends_at = None
        if sub:
            trial_ends_at = sub.trial_ends_at
            if sub.status == "trial" and sub.trial_ends_at and sub.trial_ends_at > now:
                trial_active = True
                tools_active = True
            elif sub.status == "active":
                tools_active = True

        return BusinessToolsStatus(
            user_id=user_id,
            tools_active=tools_active,
            trial_active=trial_active,
            trial_ends_at=trial_ends_at,
            subscription_status=sub.status if sub else "none",
            monthly_price_gbp=BUSINESS_TOOLS_MONTHLY_GBP,
        )

    async def get_status(self, user_id: UUID) -> BusinessToolsStatus:
        sub = await self._subscription(user_id)
        return self._status(user_id, sub)

    async def tools_access(self, user_id: UUID) -> BusinessToolsAccess:
        sub = await self._subscription(user_id)
        now = datetime.now(timezone.utc)
        if not sub:
            return BusinessToolsAccess(
                user_id=user_id,
                tools_allowed=False,
                status="none",
                message="Set up your business page and start a free trial to sell on the marketplace",
            )
        if sub.status == "trial" and sub.trial_ends_at and sub.trial_ends_at > now:
            return BusinessToolsAccess(
                user_id=user_id,
                tools_allowed=True,
                status="trial",
                trial_ends_at=sub.trial_ends_at,
                message=f"Business tools trial active — sell, promote, and list on marketplace",
            )
        if sub.status == "active":
            return BusinessToolsAccess(
                user_id=user_id,
                tools_allowed=True,
                status="active",
                message="Business tools subscription active",
            )
        return BusinessToolsAccess(
            user_id=user_id,
            tools_allowed=False,
            status="expired",
            trial_ends_at=sub.trial_ends_at,
            message=f"Trial ended — subscribe at £{BUSINESS_TOOLS_MONTHLY_GBP:.0f}/month for marketplace selling",
        )

    async def can_sell(self, user_id: UUID) -> bool:
        access = await self.tools_access(user_id)
        return access.tools_allowed

    async def start_trial(self, user_id: UUID) -> BusinessToolsAccess:
        if not await self._has_business_profile(user_id):
            raise HTTPException(
                status_code=400,
                detail="Create your business page before starting a business tools trial",
            )
        sub = await self._subscription(user_id)
        now = datetime.now(timezone.utc)
        if sub and sub.trial_used:
            raise HTTPException(status_code=400, detail="Business tools trial already used")
        trial_end = now + timedelta(days=BUSINESS_TRIAL_DAYS)
        if sub:
            sub.status = "trial"
            sub.trial_started_at = now
            sub.trial_ends_at = trial_end
            sub.trial_used = True
        else:
            sub = BusinessSubscriptionModel(
                id=uuid4(),
                user_id=user_id,
                plan="business_tools",
                status="trial",
                trial_started_at=now,
                trial_ends_at=trial_end,
                trial_used=True,
                monthly_price_gbp=BUSINESS_TOOLS_MONTHLY_GBP,
            )
            self.db.add(sub)
        await self.db.commit()
        return BusinessToolsAccess(
            user_id=user_id,
            tools_allowed=True,
            status="trial",
            trial_ends_at=trial_end,
            message=f"Free business tools trial active for {BUSINESS_TRIAL_DAYS} days",
        )