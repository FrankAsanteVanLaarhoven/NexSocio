from collections.abc import AsyncGenerator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.security.jwt import decode_access_token
from services.professional.application.billing_service import BillingService
from services.professional.application.business_compliance import BusinessComplianceService
from services.professional.application.career_service import CareerService
from services.professional.application.corporate_compliance import CorporateComplianceService
from services.professional.application.services import ProfessionalService
from services.professional.infrastructure.config import Settings
from services.professional.infrastructure.database import get_engine, get_session_factory

settings = Settings()
_session_factory = None
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


class AuthContext:
    def __init__(self, user_id: UUID, email: str, display_name: str):
        self.user_id = user_id
        self.email = email
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


async def get_auth_context(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> AuthContext:
    try:
        payload = decode_access_token(credentials.credentials, settings.jwt_secret)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    return AuthContext(
        user_id=UUID(payload["sub"]),
        email=payload.get("email", ""),
        display_name=payload.get("display_name", "User"),
    )


async def get_token(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> str:
    return credentials.credentials


async def get_optional_auth_context(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(optional_security)],
) -> AuthContext | None:
    if not credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials, settings.jwt_secret)
    except Exception:
        return None
    return AuthContext(
        user_id=UUID(payload["sub"]),
        email=payload.get("email", ""),
        display_name=payload.get("display_name", "User"),
    )


async def get_professional_service(
    cfg: Annotated[Settings, Depends(get_settings)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfessionalService:
    return ProfessionalService(cfg, db)


async def get_compliance_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CorporateComplianceService:
    return CorporateComplianceService(db)


async def get_career_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CareerService:
    return CareerService(db)


async def get_business_compliance_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BusinessComplianceService:
    return BusinessComplianceService(db)


async def get_billing_service(
    cfg: Annotated[Settings, Depends(get_settings)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BillingService:
    return BillingService(cfg, db)