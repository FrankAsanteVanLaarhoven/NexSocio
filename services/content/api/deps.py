from collections.abc import AsyncGenerator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.domain.enums import UserMode
from nexus_common.security.jwt import decode_access_token
from pathlib import Path

from services.content.application.media_upload import MediaUploadService
from services.content.application.services import ContentService
from services.content.infrastructure.config import Settings
from services.content.infrastructure.database import get_engine, get_session_factory

settings = Settings()
_session_factory = None
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


async def get_content_service(
    db: Annotated[AsyncSession, Depends(get_db)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> ContentService:
    return ContentService(db, cfg)


def get_media_upload_service(
    cfg: Annotated[Settings, Depends(get_settings)],
) -> MediaUploadService:
    return MediaUploadService(Path(cfg.upload_dir))


class AuthContext:
    def __init__(self, user_id: UUID, email: str, display_name: str, mode: UserMode):
        self.user_id = user_id
        self.email = email
        self.display_name = display_name
        self.mode = mode


async def get_auth_context(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> AuthContext:
    payload = decode_access_token(credentials.credentials, cfg.jwt_secret)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return AuthContext(
        user_id=UUID(payload.sub),
        email=payload.email,
        display_name=payload.resolved_display_name(),
        mode=UserMode(payload.mode),
    )


async def get_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> str:
    return credentials.credentials