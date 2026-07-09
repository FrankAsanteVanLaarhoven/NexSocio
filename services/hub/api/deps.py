from typing import Annotated

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from nexus_common.security.jwt import decode_access_token
from services.hub.application.services import HubService
from services.hub.infrastructure.config import Settings

settings = Settings()
security = HTTPBearer(auto_error=False)


def get_settings() -> Settings:
    return settings


def get_hub_service(cfg: Annotated[Settings, Depends(get_settings)]) -> HubService:
    return HubService(cfg)


async def get_optional_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str | None:
    if credentials:
        return credentials.credentials
    return None


async def get_valid_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    cfg: Annotated[Settings, Depends(get_settings)],
) -> str | None:
    if not credentials:
        return None
    payload = decode_access_token(credentials.credentials, cfg.jwt_secret)
    if payload:
        return credentials.credentials
    return None