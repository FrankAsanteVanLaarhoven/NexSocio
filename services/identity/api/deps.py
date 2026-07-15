from collections.abc import AsyncGenerator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.security.jwt import decode_access_token
from services.identity.application.auth_service import AuthService
from services.identity.application.location_service import LocationService
from services.identity.application.services import IdentityService
from services.identity.infrastructure.config import Settings
from services.identity.infrastructure.database import get_session_factory
from services.identity.infrastructure.models import UserModel

settings = Settings()
_session_factory = None


def get_settings() -> Settings:
    return settings


def _get_session_factory():
    global _session_factory
    if _session_factory is None:
        from services.identity.infrastructure.database import get_engine

        engine = get_engine(settings.database_url)
        _session_factory = get_session_factory(engine)
    return _session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    factory = _get_session_factory()
    async with factory() as session:
        yield session


async def get_identity_service(
    db: Annotated[AsyncSession, Depends(get_db)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> IdentityService:
    return IdentityService(db, cfg.jwt_secret)


async def get_location_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LocationService:
    return LocationService(db)


async def get_auth_service(
    db: Annotated[AsyncSession, Depends(get_db)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> AuthService:
    return AuthService(db, cfg.jwt_secret, webauthn_rp_id=cfg.webauthn_rp_id)


security = HTTPBearer()


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> UUID:
    payload = decode_access_token(credentials.credentials, cfg.jwt_secret)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return UUID(payload.sub)


async def get_current_user(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> UserModel:
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if getattr(user, "status", "active") in ("suspended", "banned"):
        raise HTTPException(status_code=403, detail=f"This account has been {user.status}.")
    return user


async def get_current_admin(
    user: Annotated[UserModel, Depends(get_current_user)]
) -> UserModel:
    if getattr(user, "role", "user") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Admin permissions required")
    return user