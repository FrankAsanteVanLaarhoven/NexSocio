from collections.abc import AsyncGenerator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.security.jwt import decode_access_token, TokenPayload
from nexus_common.security.rate_limit import RateLimiter
from services.safety.application.services import SafetyService
from services.safety.infrastructure.config import Settings
from services.safety.infrastructure.database import get_engine, get_session_factory

settings = Settings()
_session_factory = None
_limiter = RateLimiter(requests_per_minute=settings.rate_limit_rpm)
security = HTTPBearer()


def get_settings() -> Settings:
    return settings


def _get_session_factory():
    global _session_factory
    if _session_factory is None:
        engine = get_engine(settings.database_url)
        _session_factory = get_session_factory(engine)
    return _session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    factory = _get_session_factory()
    async with factory() as session:
        yield session


async def get_safety_service(
    db: Annotated[AsyncSession, Depends(get_db)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> SafetyService:
    return SafetyService(db, _limiter, content_url=cfg.content_url)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> UUID:
    payload = decode_access_token(credentials.credentials, cfg.jwt_secret)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return UUID(payload.sub)


async def get_current_admin(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> UUID:
    payload = decode_access_token(credentials.credentials, cfg.jwt_secret)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if getattr(payload, "role", "user") not in ("admin", "moderator"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permissions required")
    return UUID(payload.sub)


async def get_current_admin_payload(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> TokenPayload:
    payload = decode_access_token(credentials.credentials, cfg.jwt_secret)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if getattr(payload, "role", "user") not in ("admin", "moderator"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permissions required")
    return payload


async def get_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> str:
    return credentials.credentials