from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.identity.application.location_dtos import (
    LocationUpdateRequest,
    MemberLocationResponse,
    UserLocationResponse,
)
from services.identity.infrastructure.models import UserLocationModel, UserModel


class LocationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def update_location(
        self, user_id: UUID, display_name: str, request: LocationUpdateRequest
    ) -> UserLocationResponse:
        result = await self.db.execute(
            select(UserLocationModel).where(UserLocationModel.user_id == user_id)
        )
        loc = result.scalar_one_or_none()
        now = datetime.now(timezone.utc)

        if not loc:
            loc = UserLocationModel(
                user_id=user_id,
                display_name=display_name,
                lat=request.lat,
                lng=request.lng,
                location_label=request.location_label,
                find_me_enabled=request.find_me_enabled,
                share_with_followers=request.share_with_followers,
                show_live_tag=request.show_live_tag,
                is_live=request.is_live,
                last_login_label=request.location_label if request.source == "login" else None,
                last_login_at=now if request.source == "login" else None,
                live_since=now if request.is_live else None,
            )
            self.db.add(loc)
        else:
            loc.lat = request.lat
            loc.lng = request.lng
            loc.location_label = request.location_label
            loc.display_name = display_name
            loc.find_me_enabled = request.find_me_enabled
            loc.share_with_followers = request.share_with_followers
            loc.show_live_tag = request.show_live_tag
            if request.source == "login":
                loc.last_login_label = request.location_label
                loc.last_login_at = now
            if request.is_live and not loc.is_live:
                loc.live_since = now
            elif not request.is_live:
                loc.live_since = None
            loc.is_live = request.is_live

        await self.db.commit()
        await self.db.refresh(loc)
        return self._to_response(loc)

    async def get_my_location(self, user_id: UUID) -> UserLocationResponse | None:
        result = await self.db.execute(
            select(UserLocationModel).where(UserLocationModel.user_id == user_id)
        )
        loc = result.scalar_one_or_none()
        return self._to_response(loc) if loc else None

    async def get_findable_members(self) -> list[MemberLocationResponse]:
        result = await self.db.execute(
            select(UserLocationModel).where(
                (UserLocationModel.find_me_enabled == True)  # noqa: E712
                | (UserLocationModel.share_with_followers == True)  # noqa: E712
                | (UserLocationModel.is_live == True)  # noqa: E712
            )
        )
        return [self._to_member(l) for l in result.scalars().all()]

    async def get_member_location(self, user_id: UUID) -> MemberLocationResponse | None:
        result = await self.db.execute(
            select(UserLocationModel).where(UserLocationModel.user_id == user_id)
        )
        loc = result.scalar_one_or_none()
        if not loc:
            return None
        if not (loc.share_with_followers or loc.find_me_enabled or loc.is_live):
            return None
        return self._to_member(loc)

    def _to_response(self, loc: UserLocationModel) -> UserLocationResponse:
        return UserLocationResponse(
            user_id=loc.user_id,
            display_name=loc.display_name,
            lat=loc.lat,
            lng=loc.lng,
            location_label=loc.location_label,
            find_me_enabled=loc.find_me_enabled,
            share_with_followers=loc.share_with_followers,
            show_live_tag=loc.show_live_tag,
            is_live=loc.is_live,
            last_login_label=loc.last_login_label,
            last_login_at=loc.last_login_at,
            live_since=loc.live_since,
            updated_at=loc.updated_at,
        )

    def _to_member(self, loc: UserLocationModel) -> MemberLocationResponse:
        return MemberLocationResponse(
            user_id=loc.user_id,
            display_name=loc.display_name,
            lat=loc.lat,
            lng=loc.lng,
            location_label=loc.location_label,
            is_live=loc.is_live,
            find_me_enabled=loc.find_me_enabled,
            live_since=loc.live_since,
            updated_at=loc.updated_at,
        )