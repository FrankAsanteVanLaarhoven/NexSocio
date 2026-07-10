"""Corporate email verification, credentials, public services, and networking subscriptions."""

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.domain.corporate_sectors import (
    CORPORATE_NETWORKING_MONTHLY_GBP,
    CORPORATE_SECTORS,
    CORPORATE_TRIAL_DAYS,
    SECTOR_IDS,
    email_domain_matches,
    extract_email_domain,
    is_corporate_email,
)
from services.professional.application.dtos import (
    CorporateComplianceStatus,
    CorporateCredentialResponse,
    CorporateSectorCommunityResponse,
    CorporateServiceListingResponse,
    OrgNetworkingAccess,
    SubmitCorporateCredentialsRequest,
    VerifyCorporateEmailRequest,
)
from services.professional.infrastructure.models import (
    CorporateCredentialModel,
    CorporateSectorCommunityModel,
    CorporateServiceListingModel,
    OrganizationModel,
    OrgSubscriptionModel,
)


class CorporateComplianceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def list_sectors() -> list[dict]:
        return list(CORPORATE_SECTORS)

    async def list_communities(self) -> list[CorporateSectorCommunityResponse]:
        """List sector communities (stub — seeded from corporate sector taxonomy)."""
        result = await self.db.execute(
            select(CorporateSectorCommunityModel).order_by(CorporateSectorCommunityModel.sector_name)
        )
        rows = list(result.scalars().all())
        if not rows:
            for sector in CORPORATE_SECTORS:
                row = CorporateSectorCommunityModel(
                    id=uuid4(),
                    sector_id=sector["id"],
                    sector_name=sector["label"],
                    member_count=0,
                )
                self.db.add(row)
                rows.append(row)
            await self.db.commit()
            for row in rows:
                await self.db.refresh(row)

        return [
            CorporateSectorCommunityResponse(
                id=r.id,
                sector_id=r.sector_id,
                sector_name=r.sector_name,
                member_count=r.member_count,
            )
            for r in rows
        ]

    async def _org(self, org_id: UUID) -> OrganizationModel:
        result = await self.db.execute(
            select(OrganizationModel).where(OrganizationModel.id == org_id)
        )
        org = result.scalar_one_or_none()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return org

    async def _subscription(self, org_id: UUID) -> OrgSubscriptionModel | None:
        result = await self.db.execute(
            select(OrgSubscriptionModel).where(OrgSubscriptionModel.org_id == org_id)
        )
        return result.scalar_one_or_none()

    def _compliance_status(self, org: OrganizationModel, sub: OrgSubscriptionModel | None) -> CorporateComplianceStatus:
        now = datetime.now(timezone.utc)
        trial_active = False
        networking_active = False
        trial_ends_at = None
        if sub:
            trial_ends_at = sub.trial_ends_at
            if sub.status == "trial" and sub.trial_ends_at and sub.trial_ends_at > now:
                trial_active = True
                networking_active = True
            elif sub.status == "active":
                networking_active = True

        return CorporateComplianceStatus(
            org_id=org.id,
            corporate_email=org.corporate_email,
            email_domain=org.email_domain,
            sector_category=org.sector_category,
            email_verified=org.email_verified,
            credentials_verified=org.credentials_verified,
            can_serve_public=org.can_serve_public,
            networking_trial_active=trial_active,
            networking_active=networking_active,
            trial_ends_at=trial_ends_at,
            subscription_status=sub.status if sub else "none",
            monthly_price_gbp=CORPORATE_NETWORKING_MONTHLY_GBP,
        )

    async def get_compliance(self, org_id: UUID) -> CorporateComplianceStatus:
        org = await self._org(org_id)
        sub = await self._subscription(org_id)
        return self._compliance_status(org, sub)

    async def verify_email(
        self, org_id: UUID, admin_email: str, request: VerifyCorporateEmailRequest
    ) -> CorporateComplianceStatus:
        org = await self._org(org_id)
        if not is_corporate_email(request.corporate_email):
            raise HTTPException(
                status_code=400,
                detail="Corporate email required — personal providers (Gmail, Yahoo, etc.) are not allowed",
            )
        domain = extract_email_domain(request.corporate_email)
        if not email_domain_matches(admin_email, domain):
            raise HTTPException(
                status_code=400,
                detail=f"Sign in with your corporate email @{domain} to verify this organisation",
            )
        org.corporate_email = request.corporate_email.lower()
        org.email_domain = domain
        org.email_verified = True
        org.verified = org.email_verified and org.credentials_verified
        org.can_serve_public = org.verified
        await self.db.commit()
        await self.db.refresh(org)
        sub = await self._subscription(org_id)
        return self._compliance_status(org, sub)

    async def submit_credentials(
        self, org_id: UUID, request: SubmitCorporateCredentialsRequest
    ) -> CorporateCredentialResponse:
        org = await self._org(org_id)
        if not org.email_verified:
            raise HTTPException(status_code=400, detail="Verify corporate email before submitting credentials")
        if request.sector_category not in SECTOR_IDS:
            raise HTTPException(status_code=400, detail="Invalid sector category")

        result = await self.db.execute(
            select(CorporateCredentialModel).where(CorporateCredentialModel.org_id == org_id)
        )
        row = result.scalar_one_or_none()
        if row:
            row.registration_number = request.registration_number
            row.license_body = request.license_body
            row.sector_category = request.sector_category
            row.status = "approved"
            row.notes = request.notes
        else:
            row = CorporateCredentialModel(
                id=uuid4(),
                org_id=org_id,
                registration_number=request.registration_number,
                license_body=request.license_body,
                sector_category=request.sector_category,
                status="approved",
                notes=request.notes,
            )
            self.db.add(row)

        org.sector_category = request.sector_category
        org.industry = next((s["label"] for s in CORPORATE_SECTORS if s["id"] == request.sector_category), request.sector_category)
        org.credentials_verified = True
        org.verified = org.email_verified and org.credentials_verified
        org.can_serve_public = org.verified
        await self.db.commit()
        await self.db.refresh(row)
        return CorporateCredentialResponse(
            org_id=org_id,
            sector_category=row.sector_category,
            registration_number=row.registration_number,
            license_body=row.license_body,
            status=row.status,
            notes=row.notes,
        )

    async def start_networking_trial(self, org_id: UUID) -> OrgNetworkingAccess:
        org = await self._org(org_id)
        if not org.email_verified or not org.credentials_verified:
            raise HTTPException(
                status_code=400,
                detail="Qualify with corporate email and credentials before networking trial",
            )
        sub = await self._subscription(org_id)
        now = datetime.now(timezone.utc)
        if sub and sub.trial_used:
            raise HTTPException(status_code=400, detail="Networking trial already used for this organisation")
        trial_end = now + timedelta(days=CORPORATE_TRIAL_DAYS)
        if sub:
            sub.status = "trial"
            sub.trial_started_at = now
            sub.trial_ends_at = trial_end
            sub.trial_used = True
        else:
            sub = OrgSubscriptionModel(
                id=uuid4(),
                org_id=org_id,
                plan="corporate_networking",
                status="trial",
                trial_started_at=now,
                trial_ends_at=trial_end,
                trial_used=True,
                monthly_price_gbp=CORPORATE_NETWORKING_MONTHLY_GBP,
            )
            self.db.add(sub)
        await self.db.commit()
        return OrgNetworkingAccess(
            org_id=org_id,
            networking_allowed=True,
            status="trial",
            trial_ends_at=trial_end,
            message=f"Free networking trial active for {CORPORATE_TRIAL_DAYS} days",
        )

    async def networking_access(self, org_id: UUID) -> OrgNetworkingAccess:
        org = await self._org(org_id)
        sub = await self._subscription(org_id)
        now = datetime.now(timezone.utc)
        if not sub:
            return OrgNetworkingAccess(
                org_id=org_id,
                networking_allowed=False,
                status="none",
                message="Start a free trial after email and credential verification",
            )
        if sub.status == "trial" and sub.trial_ends_at and sub.trial_ends_at > now:
            return OrgNetworkingAccess(
                org_id=org_id,
                networking_allowed=True,
                status="trial",
                trial_ends_at=sub.trial_ends_at,
                message="Trial active — job posts, people search, and B2B networking",
            )
        if sub.status == "active":
            return OrgNetworkingAccess(
                org_id=org_id,
                networking_allowed=True,
                status="active",
                message="Corporate networking subscription active",
            )
        return OrgNetworkingAccess(
            org_id=org_id,
            networking_allowed=False,
            status="expired",
            trial_ends_at=sub.trial_ends_at,
            message=f"Trial ended — subscribe at £{CORPORATE_NETWORKING_MONTHLY_GBP:.0f}/month for networking and job posts",
        )

    async def can_serve_public(self, org_id: UUID) -> bool:
        org = await self._org(org_id)
        return bool(org.can_serve_public)

    async def create_public_service(
        self, org_id: UUID, title: str, description: str, price_hint: str | None = None
    ) -> CorporateServiceListingResponse:
        org = await self._org(org_id)
        if not org.can_serve_public:
            raise HTTPException(
                status_code=403,
                detail="Corporate credentials required before advertising services to the public",
            )
        listing = CorporateServiceListingModel(
            id=uuid4(),
            org_id=org_id,
            org_name=org.name,
            sector_category=org.sector_category or "general",
            title=title,
            description=description,
            price_hint=price_hint,
            is_public=True,
        )
        self.db.add(listing)
        await self.db.commit()
        await self.db.refresh(listing)
        return self._listing(listing)

    async def list_public_services(
        self, sector: str | None = None
    ) -> list[CorporateServiceListingResponse]:
        query = (
            select(CorporateServiceListingModel)
            .where(CorporateServiceListingModel.is_public.is_(True))
            .order_by(CorporateServiceListingModel.created_at.desc())
        )
        if sector and sector != "all":
            query = query.where(CorporateServiceListingModel.sector_category == sector)
        result = await self.db.execute(query.limit(100))
        return [self._listing(row) for row in result.scalars().all()]

    @staticmethod
    def _listing(row: CorporateServiceListingModel) -> CorporateServiceListingResponse:
        return CorporateServiceListingResponse(
            id=row.id,
            org_id=row.org_id,
            org_name=row.org_name,
            sector_category=row.sector_category,
            title=row.title,
            description=row.description,
            price_hint=row.price_hint,
            is_public=row.is_public,
            created_at=row.created_at,
        )