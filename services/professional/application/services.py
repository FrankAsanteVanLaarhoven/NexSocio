from uuid import UUID, uuid4

import httpx
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from nexus_common.domain.corporate_sectors import (
    CORPORATE_SECTORS,
    SECTOR_IDS,
    extract_email_domain,
    is_corporate_email,
)
from services.professional.application.business_compliance import BusinessComplianceService
from services.professional.application.corporate_compliance import CorporateComplianceService
from services.professional.application.dtos import (
    BusinessProfileResponse,
    CorporateDashboardResponse,
    CreateOrganizationRequest,
    NetworkInsight,
    OrgMembershipResponse,
    OrganizationResponse,
    ProfessionalDashboardResponse,
    ProfessionalProfileResponse,
    UpdateProfessionalProfileRequest,
    UpsertBusinessProfileRequest,
)
from services.professional.infrastructure.config import Settings
from services.professional.infrastructure.models import (
    BusinessProfileModel,
    OrgMembershipModel,
    OrganizationModel,
)


class ProfessionalService:
    def __init__(self, settings: Settings, db: AsyncSession | None = None):
        self.settings = settings
        self.db = db

    async def _identity_request(self, method: str, path: str, token: str, json: dict | None = None):
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.request(
                method,
                f"{self.settings.identity_service_url}{path}",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=json,
            )
            if res.status_code >= 400:
                detail = res.json().get("detail", res.text) if res.text else "Identity service error"
                raise HTTPException(status_code=res.status_code, detail=detail)
            return res.json().get("data")

    async def get_profile(self, token: str) -> ProfessionalProfileResponse:
        data = await self._identity_request("GET", "/api/v1/users/me", token)
        return ProfessionalProfileResponse(
            user_id=UUID(data["id"]),
            display_name=data["display_name"],
            headline=data.get("headline"),
            company=data.get("company"),
            skills=data.get("skills"),
            bio=data.get("bio"),
        )

    async def update_profile(
        self, token: str, request: UpdateProfessionalProfileRequest
    ) -> ProfessionalProfileResponse:
        payload = request.model_dump(exclude_none=True)
        data = await self._identity_request("PUT", "/api/v1/users/me", token, payload)
        return ProfessionalProfileResponse(
            user_id=UUID(data["id"]),
            display_name=data["display_name"],
            headline=data.get("headline"),
            company=data.get("company"),
            skills=data.get("skills"),
            bio=data.get("bio"),
        )

    async def get_dashboard(self, token: str) -> ProfessionalDashboardResponse:
        profile = await self.get_profile(token)
        biz = await self.get_business_profile(UUID(str(profile.user_id)))
        biz_name = biz.business_name if biz else profile.company or "Your business"
        business_tools = None
        if self.db:
            business_tools = await BusinessComplianceService(self.db).tools_access(profile.user_id)
        tools_label = "Active" if business_tools and business_tools.tools_allowed else "Trial needed"
        return ProfessionalDashboardResponse(
            profile=profile,
            insights=[
                NetworkInsight(label="Business page", value=biz_name, trend="active"),
                NetworkInsight(label="Business tools", value=tools_label, trend="neutral"),
                NetworkInsight(label="Marketplace clicks", value="34", trend="up"),
            ],
            connection_suggestions=["Local sellers near you", "Creators in your category"],
            business_tools=business_tools,
        )

    async def get_corporate_dashboard(self, token: str, user_id: UUID) -> CorporateDashboardResponse:
        profile = await self.get_profile(token)
        memberships = await self.list_memberships(user_id)
        compliance: list = []
        networking: list = []
        if self.db:
            compliance_svc = CorporateComplianceService(self.db)
            for m in memberships:
                compliance.append(await compliance_svc.get_compliance(m.org_id))
                networking.append(await compliance_svc.networking_access(m.org_id))
        return CorporateDashboardResponse(
            profile=profile,
            memberships=memberships,
            insights=[
                NetworkInsight(label="Companies", value=str(len(memberships)), trend="neutral"),
                NetworkInsight(label="Verified orgs", value=str(sum(1 for c in compliance if c.can_serve_public)), trend="up"),
                NetworkInsight(label="Networking", value=str(sum(1 for n in networking if n.networking_allowed)), trend="neutral"),
            ],
            hiring_posts=0,
            compliance=compliance,
            networking_access=networking,
        )

    async def get_business_profile(self, user_id: UUID) -> BusinessProfileResponse | None:
        if not self.db:
            return None
        result = await self.db.execute(
            select(BusinessProfileModel).where(BusinessProfileModel.user_id == user_id)
        )
        row = result.scalar_one_or_none()
        if not row:
            return None
        return BusinessProfileResponse(
            id=row.id,
            user_id=row.user_id,
            business_name=row.business_name,
            category=row.category,
            tagline=row.tagline,
        )

    async def upsert_business_profile(
        self, user_id: UUID, request: UpsertBusinessProfileRequest
    ) -> BusinessProfileResponse:
        if not self.db:
            raise HTTPException(status_code=503, detail="Business profiles unavailable")
        result = await self.db.execute(
            select(BusinessProfileModel).where(BusinessProfileModel.user_id == user_id)
        )
        row = result.scalar_one_or_none()
        if row:
            row.business_name = request.business_name
            row.category = request.category
            row.tagline = request.tagline
        else:
            row = BusinessProfileModel(
                id=uuid4(),
                user_id=user_id,
                business_name=request.business_name,
                category=request.category,
                tagline=request.tagline,
            )
            self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return BusinessProfileResponse(
            id=row.id,
            user_id=row.user_id,
            business_name=row.business_name,
            category=row.category,
            tagline=row.tagline,
        )

    async def list_organizations(
        self, industry: str | None = None, sector: str | None = None, public_only: bool = False
    ) -> list[OrganizationResponse]:
        if not self.db:
            return []
        query = select(OrganizationModel).order_by(OrganizationModel.name.asc())
        if industry:
            query = query.where(OrganizationModel.industry == industry)
        if sector:
            query = query.where(OrganizationModel.sector_category == sector)
        if public_only:
            query = query.where(OrganizationModel.can_serve_public.is_(True))
        result = await self.db.execute(query.limit(50))
        return [self._org(row) for row in result.scalars().all()]

    async def create_organization(
        self, user_id: UUID, request: CreateOrganizationRequest
    ) -> OrganizationResponse:
        if not self.db:
            raise HTTPException(status_code=503, detail="Organizations unavailable")
        existing = await self.db.execute(
            select(OrganizationModel).where(OrganizationModel.slug == request.slug)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Organization slug already exists")
        if not is_corporate_email(request.corporate_email):
            raise HTTPException(
                status_code=400,
                detail="Corporate email required — use your company domain, not Gmail/Yahoo/etc.",
            )
        if request.sector_category not in SECTOR_IDS:
            raise HTTPException(status_code=400, detail="Invalid sector category")
        domain = extract_email_domain(request.corporate_email)
        sector_label = next((s["label"] for s in CORPORATE_SECTORS if s["id"] == request.sector_category), request.sector_category)
        org = OrganizationModel(
            id=uuid4(),
            name=request.name,
            slug=request.slug,
            industry=request.industry or sector_label,
            sector_category=request.sector_category,
            corporate_email=request.corporate_email.lower(),
            email_domain=domain,
            size_band=request.size_band,
            website=request.website,
            description=request.description,
            email_verified=False,
            credentials_verified=False,
            can_serve_public=False,
            verified=False,
        )
        self.db.add(org)
        self.db.add(
            OrgMembershipModel(
                id=uuid4(),
                org_id=org.id,
                user_id=user_id,
                role="admin",
                title="Founder",
            )
        )
        await self.db.commit()
        await self.db.refresh(org)
        return self._org(org)

    async def list_memberships(self, user_id: UUID) -> list[OrgMembershipResponse]:
        if not self.db:
            return []
        result = await self.db.execute(
            select(OrgMembershipModel, OrganizationModel)
            .join(OrganizationModel, OrganizationModel.id == OrgMembershipModel.org_id)
            .where(OrgMembershipModel.user_id == user_id)
        )
        rows = result.all()
        return [
            OrgMembershipResponse(
                org_id=membership.org_id,
                org_name=org.name,
                role=membership.role,
                title=membership.title,
            )
            for membership, org in rows
        ]

    async def user_belongs_to_org(self, user_id: UUID, org_id: UUID) -> bool:
        if not self.db:
            return False
        result = await self.db.execute(
            select(OrgMembershipModel).where(
                OrgMembershipModel.user_id == user_id,
                OrgMembershipModel.org_id == org_id,
            )
        )
        return result.scalar_one_or_none() is not None

    @staticmethod
    def _org(row: OrganizationModel) -> OrganizationResponse:
        return OrganizationResponse(
            id=row.id,
            name=row.name,
            slug=row.slug,
            industry=row.industry,
            sector_category=row.sector_category,
            size_band=row.size_band,
            website=row.website,
            description=row.description,
            corporate_email=row.corporate_email,
            email_domain=row.email_domain,
            email_verified=getattr(row, "email_verified", False) or False,
            credentials_verified=getattr(row, "credentials_verified", False) or False,
            can_serve_public=getattr(row, "can_serve_public", False) or False,
            verified=row.verified,
            created_at=row.created_at,
        )