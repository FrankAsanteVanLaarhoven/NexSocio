from collections.abc import AsyncGenerator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.security.jwt import decode_access_token
from services.notification.application.services import NotificationService
from services.notification.infrastructure.config import Settings
from services.notification.infrastructure.database import get_engine, get_session_factory

settings = Settings()
_session_factory = None
security = HTTPBearer(auto_error=False)


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


async def get_notification_service(
    db: Annotated[AsyncSession, Depends(get_db)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> NotificationService:
    return NotificationService(db, cfg)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> UUID | None:
    if not credentials:
        return None
    payload = decode_access_token(credentials.credentials, cfg.jwt_secret)
    if not payload:
        return None
    return UUID(payload.sub)


async def require_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(HTTPBearer())],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> UUID:
    payload = decode_access_token(credentials.credentials, cfg.jwt_secret)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return UUID(payload.sub)