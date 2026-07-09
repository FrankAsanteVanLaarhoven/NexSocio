from collections.abc import AsyncGenerator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.security.jwt import decode_access_token
from services.collaboration.application.services import CollaborationService
from services.collaboration.infrastructure.config import Settings
from services.collaboration.infrastructure.database import get_engine, get_session_factory

settings = Settings()
_session_factory = None
security = HTTPBearer()


class AuthContext:
    def __init__(self, user_id: UUID, display_name: str):
        self.user_id = user_id
        self.display_name = display_name


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


async def get_collaboration_service(
    db: Annotated[AsyncSession, Depends(get_db)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> CollaborationService:
    return CollaborationService(db, cfg)


async def get_auth_context(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> AuthContext:
    payload = decode_access_token(credentials.credentials, cfg.jwt_secret)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return AuthContext(user_id=UUID(payload.sub), display_name=payload.resolved_display_name())


async def get_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> str:
    return credentials.credentials


async def verify_call_room_access(user_id: UUID, room_code: str) -> None:
    factory = _get_session_factory()
    async with factory() as db:
        service = CollaborationService(db, settings)
        await service.verify_call_room(user_id, room_code.upper())