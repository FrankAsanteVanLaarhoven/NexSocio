from uuid import UUID, uuid4

import bcrypt
from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.domain.enums import UserMode
from nexus_common.security.jwt import create_access_token
from nexus_common.security.zkp import ZKPVerifier
from services.identity.application.dtos import (
    ModeSelectRequest,
    ModeSelectResponse,
    PublicUserResponse,
    RegisterRequest,
    RegisterResponse,
    UpdateProfileRequest,
    UserResponse,
)
from services.identity.infrastructure.models import UserModel


class IdentityService:
    def __init__(self, db: AsyncSession, jwt_secret: str, zkp_verifier: ZKPVerifier | None = None):
        self.db = db
        self.jwt_secret = jwt_secret
        self.zkp = zkp_verifier or ZKPVerifier()

    def _hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def _verify_password(self, password: str, password_hash: str) -> bool:
        return bcrypt.checkpw(password.encode(), password_hash.encode())

    def _suggest_mode(self, age_verified: bool, minimum_age_met: bool) -> UserMode:
        if not age_verified or not minimum_age_met:
            return UserMode.KIDS
        return UserMode.PRIME

    def _resolve_subscription_tier(self, user: UserModel) -> str:
        tier = getattr(user, "subscription_tier", None) or "free"
        if tier in ("premium", "business"):
            return tier
        if UserMode(user.mode) == UserMode.PROFESSIONAL:
            return "business"
        if (user.beta_cohort or "") in ("founding", "early_access"):
            return "premium"
        return "free"

    def _to_user_response(self, user: UserModel) -> UserResponse:
        tier = self._resolve_subscription_tier(user)
        return UserResponse(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            mode=UserMode(user.mode),
            age_verified=user.age_verified,
            bio=user.bio,
            headline=user.headline,
            skills=user.skills,
            company=user.company,
            beta_cohort=user.beta_cohort or "public_beta",
            subscription_tier=tier,
            can_hide_ai_tag=tier in ("premium", "business"),
            created_at=user.created_at,
        )

    async def register(self, request: RegisterRequest) -> RegisterResponse:
        zkp_result = self.zkp.verify_age(request.age_proof)
        if not zkp_result.verified:
            raise HTTPException(status_code=400, detail=zkp_result.message)

        existing = await self.db.execute(select(UserModel).where(UserModel.email == request.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already registered")

        user_id = uuid4()
        mode = self._suggest_mode(zkp_result.verified, zkp_result.minimum_age_met)

        user = UserModel(
            id=user_id,
            email=request.email,
            display_name=request.display_name,
            password_hash=self._hash_password(request.password),
            mode=mode.value,
            age_verified=zkp_result.verified,
            zkp_proof_hash=zkp_result.proof_hash,
            beta_cohort="founding",
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        token = create_access_token(
            user_id, request.email, request.display_name, mode.value, self.jwt_secret
        )

        return RegisterResponse(
            user_id=user_id,
            email=request.email,
            display_name=request.display_name,
            mode=mode,
            age_verified=zkp_result.verified,
            access_token=token,
            zkp_result=zkp_result,
        )

    async def select_mode(self, user_id: UUID, request: ModeSelectRequest) -> ModeSelectResponse:
        result = await self.db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if request.mode == UserMode.PROFESSIONAL and not user.age_verified:
            raise HTTPException(
                status_code=403,
                detail="Professional mode requires verified age credentials",
            )

        user.mode = request.mode.value
        await self.db.commit()

        token = create_access_token(
            user_id, user.email, user.display_name, request.mode.value, self.jwt_secret
        )
        return ModeSelectResponse(user_id=user_id, mode=request.mode, access_token=token)

    async def get_user(self, user_id: UUID) -> UserResponse | None:
        result = await self.db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None
        return self._to_user_response(user)

    async def get_public_user(self, user_id: UUID) -> PublicUserResponse | None:
        result = await self.db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None
        return PublicUserResponse(
            id=user.id,
            display_name=user.display_name,
            mode=UserMode(user.mode),
            bio=user.bio,
            headline=user.headline,
            skills=user.skills,
            company=user.company,
        )

    async def update_profile(self, user_id: UUID, request: UpdateProfileRequest) -> UserResponse:
        result = await self.db.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if request.new_password:
            if not request.current_password:
                raise HTTPException(status_code=400, detail="Current password required")
            if not self._verify_password(request.current_password, user.password_hash):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
            user.password_hash = self._hash_password(request.new_password)

        if request.display_name is not None:
            user.display_name = request.display_name
        if request.bio is not None:
            user.bio = request.bio
        if request.headline is not None:
            user.headline = request.headline
        if request.skills is not None:
            user.skills = request.skills
        if request.company is not None:
            user.company = request.company

        await self.db.commit()
        await self.db.refresh(user)
        return self._to_user_response(user)

    async def search_users(self, query: str, limit: int = 20) -> list[PublicUserResponse]:
        pattern = f"%{query}%"
        result = await self.db.execute(
            select(UserModel)
            .where(
                or_(
                    UserModel.display_name.ilike(pattern),
                    UserModel.email.ilike(pattern),
                    UserModel.headline.ilike(pattern),
                )
            )
            .limit(limit)
        )
        users = result.scalars().all()
        return [
            PublicUserResponse(
                id=u.id,
                display_name=u.display_name,
                mode=UserMode(u.mode),
                bio=u.bio,
                headline=u.headline,
                skills=u.skills,
                company=u.company,
            )
            for u in users
        ]