from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from nexus_common.domain.models import ApiResponse, HealthResponse

from services.professional.api.deps import (
    AuthContext,
    get_auth_context,
    get_billing_service,
    get_business_compliance_service,
    get_career_service,
    get_compliance_service,
    get_optional_auth_context,
    get_professional_service,
    get_settings,
    get_token,
)
from services.professional.application.billing_service import BillingService
from services.professional.application.business_compliance import BusinessComplianceService
from services.professional.application.career_service import CareerService
from services.professional.application.corporate_compliance import CorporateComplianceService
from services.professional.application.dtos import (
    ActivateCheckoutRequest,
    ActivateSubscriptionResponse,
    AddToShortlistRequest,
    ApplyJobRequest,
    CareerProfileResponse,
    CreateExperienceRequest,
    CreateSubscriptionCheckoutRequest,
    CreateJobRequest,
    ExperienceResponse,
    JobApplicationResponse,
    JobPostingResponse,
    PeopleSearchResult,
    TalentShortlistEntry,
    UpsertCareerProfileRequest,
    BusinessProfileResponse,
    BusinessToolsAccess,
    BusinessToolsStatus,
    CorporateComplianceStatus,
    CorporateCredentialResponse,
    CorporateDashboardResponse,
    CorporateServiceListingResponse,
    CreateCorporateServiceRequest,
    CreateOrganizationRequest,
    CvParseRequest,
    CvParseResponse,
    CorporateSectorCommunityResponse,
    OrganizationResponse,
    OrgMembershipResponse,
    OrgNetworkingAccess,
    ProfessionalDashboardResponse,
    ProfessionalProfileResponse,
    SubscriptionCheckoutResponse,
    SubmitCorporateCredentialsRequest,
    UpdateProfessionalProfileRequest,
    UpsertBusinessProfileRequest,
    VerifyCorporateEmailRequest,
)
from services.professional.application.services import ProfessionalService
from services.professional.infrastructure.config import Settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(service=settings.service_name)


@router.get("/profile", response_model=ApiResponse[ProfessionalProfileResponse])
async def get_profile(
    token: Annotated[str, Depends(get_token)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[ProfessionalProfileResponse]:
    result = await service.get_profile(token)
    return ApiResponse(data=result)


@router.put("/profile", response_model=ApiResponse[ProfessionalProfileResponse])
async def update_profile(
    request: UpdateProfessionalProfileRequest,
    token: Annotated[str, Depends(get_token)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[ProfessionalProfileResponse]:
    result = await service.update_profile(token, request)
    return ApiResponse(data=result)


@router.get("/dashboard", response_model=ApiResponse[ProfessionalDashboardResponse])
async def dashboard(
    token: Annotated[str, Depends(get_token)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[ProfessionalDashboardResponse]:
    result = await service.get_dashboard(token)
    return ApiResponse(data=result)


@router.get("/dashboard/corporate", response_model=ApiResponse[CorporateDashboardResponse])
async def corporate_dashboard(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    token: Annotated[str, Depends(get_token)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[CorporateDashboardResponse]:
    result = await service.get_corporate_dashboard(token, auth.user_id)
    return ApiResponse(data=result)


@router.get("/business-profile", response_model=ApiResponse[BusinessProfileResponse | None])
async def get_business_profile(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[BusinessProfileResponse | None]:
    result = await service.get_business_profile(auth.user_id)
    return ApiResponse(data=result)


@router.put("/business-profile", response_model=ApiResponse[BusinessProfileResponse])
async def upsert_business_profile(
    request: UpsertBusinessProfileRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[BusinessProfileResponse]:
    result = await service.upsert_business_profile(auth.user_id, request)
    return ApiResponse(data=result)


@router.get("/business/tools", response_model=ApiResponse[BusinessToolsAccess])
async def business_tools_access(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    compliance: Annotated[BusinessComplianceService, Depends(get_business_compliance_service)],
) -> ApiResponse[BusinessToolsAccess]:
    return ApiResponse(data=await compliance.tools_access(auth.user_id))


@router.get("/business/subscription", response_model=ApiResponse[BusinessToolsStatus])
async def business_subscription_status(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    compliance: Annotated[BusinessComplianceService, Depends(get_business_compliance_service)],
) -> ApiResponse[BusinessToolsStatus]:
    return ApiResponse(data=await compliance.get_status(auth.user_id))


@router.post("/business/subscription/trial", response_model=ApiResponse[BusinessToolsAccess])
async def start_business_tools_trial(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    compliance: Annotated[BusinessComplianceService, Depends(get_business_compliance_service)],
) -> ApiResponse[BusinessToolsAccess]:
    return ApiResponse(data=await compliance.start_trial(auth.user_id))


@router.post("/business/subscription/checkout", response_model=ApiResponse[SubscriptionCheckoutResponse])
async def business_subscription_checkout(
    request: CreateSubscriptionCheckoutRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    billing: Annotated[BillingService, Depends(get_billing_service)],
) -> ApiResponse[SubscriptionCheckoutResponse]:
    result = await billing.create_business_checkout(
        auth.user_id,
        request.success_url,
        request.cancel_url,
        customer_email=auth.email or None,
    )
    return ApiResponse(data=result)


@router.get("/business/users/{user_id}/can-sell", response_model=ApiResponse[bool])
async def business_user_can_sell(
    user_id: UUID,
    compliance: Annotated[BusinessComplianceService, Depends(get_business_compliance_service)],
) -> ApiResponse[bool]:
    return ApiResponse(data=await compliance.can_sell(user_id))


@router.get("/organizations", response_model=ApiResponse[list[OrganizationResponse]])
async def list_organizations(
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
    industry: str | None = Query(default=None),
    sector: str | None = Query(default=None),
    public_only: bool = Query(default=False),
) -> ApiResponse[list[OrganizationResponse]]:
    result = await service.list_organizations(industry=industry, sector=sector, public_only=public_only)
    return ApiResponse(data=result)


@router.get("/corporate/sectors", response_model=ApiResponse[list[dict]])
async def corporate_sectors(
    compliance: Annotated[CorporateComplianceService, Depends(get_compliance_service)],
) -> ApiResponse[list[dict]]:
    return ApiResponse(data=compliance.list_sectors())


@router.get("/corporate/communities", response_model=ApiResponse[list[CorporateSectorCommunityResponse]])
async def corporate_communities(
    compliance: Annotated[CorporateComplianceService, Depends(get_compliance_service)],
) -> ApiResponse[list[CorporateSectorCommunityResponse]]:
    return ApiResponse(data=await compliance.list_communities())


@router.get("/corporate/services/public", response_model=ApiResponse[list[CorporateServiceListingResponse]])
async def public_corporate_services(
    compliance: Annotated[CorporateComplianceService, Depends(get_compliance_service)],
    sector: str | None = Query(default=None),
) -> ApiResponse[list[CorporateServiceListingResponse]]:
    return ApiResponse(data=await compliance.list_public_services(sector=sector))


@router.get(
    "/organizations/{org_id}/compliance",
    response_model=ApiResponse[CorporateComplianceStatus],
)
async def org_compliance(
    org_id: UUID,
    compliance: Annotated[CorporateComplianceService, Depends(get_compliance_service)],
) -> ApiResponse[CorporateComplianceStatus]:
    return ApiResponse(data=await compliance.get_compliance(org_id))


@router.post(
    "/organizations/{org_id}/verify-email",
    response_model=ApiResponse[CorporateComplianceStatus],
)
async def verify_org_email(
    org_id: UUID,
    request: VerifyCorporateEmailRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    compliance: Annotated[CorporateComplianceService, Depends(get_compliance_service)],
) -> ApiResponse[CorporateComplianceStatus]:
    return ApiResponse(data=await compliance.verify_email(org_id, auth.email, request))


@router.post(
    "/organizations/{org_id}/credentials",
    response_model=ApiResponse[CorporateCredentialResponse],
)
async def submit_org_credentials(
    org_id: UUID,
    request: SubmitCorporateCredentialsRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
    compliance: Annotated[CorporateComplianceService, Depends(get_compliance_service)],
) -> ApiResponse[CorporateCredentialResponse]:
    if not await service.user_belongs_to_org(auth.user_id, org_id):
        raise HTTPException(status_code=403, detail="Must be an organisation member")
    return ApiResponse(data=await compliance.submit_credentials(org_id, request))


@router.post(
    "/organizations/{org_id}/subscription/trial",
    response_model=ApiResponse[OrgNetworkingAccess],
)
async def start_networking_trial(
    org_id: UUID,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
    compliance: Annotated[CorporateComplianceService, Depends(get_compliance_service)],
) -> ApiResponse[OrgNetworkingAccess]:
    if not await service.user_belongs_to_org(auth.user_id, org_id):
        raise HTTPException(status_code=403, detail="Must be an organisation member")
    return ApiResponse(data=await compliance.start_networking_trial(org_id))


@router.post(
    "/organizations/{org_id}/subscription/checkout",
    response_model=ApiResponse[SubscriptionCheckoutResponse],
)
async def corporate_subscription_checkout(
    org_id: UUID,
    request: CreateSubscriptionCheckoutRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
    billing: Annotated[BillingService, Depends(get_billing_service)],
) -> ApiResponse[SubscriptionCheckoutResponse]:
    if not await service.user_belongs_to_org(auth.user_id, org_id):
        raise HTTPException(status_code=403, detail="Must be an organisation member")
    result = await billing.create_corporate_checkout(
        org_id,
        auth.user_id,
        request.success_url,
        request.cancel_url,
        customer_email=auth.email or None,
    )
    return ApiResponse(data=result)


@router.post("/billing/activate-success", response_model=ApiResponse[ActivateSubscriptionResponse])
async def activate_subscription_success(
    request: ActivateCheckoutRequest,
    billing: Annotated[BillingService, Depends(get_billing_service)],
) -> ApiResponse[ActivateSubscriptionResponse]:
    return ApiResponse(data=await billing.activate_from_checkout(request.session_id))


@router.get("/billing/activate-dev")
async def activate_subscription_dev(
    plan: str,
    user_id: UUID,
    success_url: str,
    billing: Annotated[BillingService, Depends(get_billing_service)],
    org_id: UUID | None = None,
) -> RedirectResponse:
    await billing.activate_dev(plan=plan, user_id=user_id, org_id=org_id)
    return RedirectResponse(url=success_url, status_code=303)


@router.post("/billing/webhook")
async def stripe_billing_webhook(
    request: Request,
    billing: Annotated[BillingService, Depends(get_billing_service)],
) -> dict[str, str]:
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    return await billing.handle_webhook(payload, signature)


@router.get(
    "/organizations/{org_id}/networking",
    response_model=ApiResponse[OrgNetworkingAccess],
)
async def org_networking_access(
    org_id: UUID,
    compliance: Annotated[CorporateComplianceService, Depends(get_compliance_service)],
) -> ApiResponse[OrgNetworkingAccess]:
    return ApiResponse(data=await compliance.networking_access(org_id))


@router.post(
    "/organizations/{org_id}/services",
    response_model=ApiResponse[CorporateServiceListingResponse],
)
async def create_corporate_service(
    org_id: UUID,
    request: CreateCorporateServiceRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
    compliance: Annotated[CorporateComplianceService, Depends(get_compliance_service)],
) -> ApiResponse[CorporateServiceListingResponse]:
    if not await service.user_belongs_to_org(auth.user_id, org_id):
        raise HTTPException(status_code=403, detail="Must be an organisation member")
    result = await compliance.create_public_service(
        org_id, request.title, request.description, request.price_hint
    )
    return ApiResponse(data=result)


@router.get(
    "/organizations/{org_id}/can-sell",
    response_model=ApiResponse[bool],
)
async def org_can_sell(
    org_id: UUID,
    compliance: Annotated[CorporateComplianceService, Depends(get_compliance_service)],
) -> ApiResponse[bool]:
    return ApiResponse(data=await compliance.can_serve_public(org_id))


@router.post("/organizations", response_model=ApiResponse[OrganizationResponse])
async def create_organization(
    request: CreateOrganizationRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[OrganizationResponse]:
    result = await service.create_organization(auth.user_id, request)
    return ApiResponse(data=result)


@router.get("/organizations/memberships", response_model=ApiResponse[list[OrgMembershipResponse]])
async def list_memberships(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[list[OrgMembershipResponse]]:
    result = await service.list_memberships(auth.user_id)
    return ApiResponse(data=result)


@router.get("/organizations/{org_id}/membership-check", response_model=ApiResponse[bool])
async def membership_check(
    org_id: UUID,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    service: Annotated[ProfessionalService, Depends(get_professional_service)],
) -> ApiResponse[bool]:
    result = await service.user_belongs_to_org(auth.user_id, org_id)
    return ApiResponse(data=result)


# --- Corporate careers (LinkedIn-class networking) ---


@router.get("/career/profile", response_model=ApiResponse[CareerProfileResponse])
async def get_career_profile(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[CareerProfileResponse]:
    return ApiResponse(data=await career.get_profile(auth.user_id, auth.display_name))


@router.put("/career/profile", response_model=ApiResponse[CareerProfileResponse])
async def upsert_career_profile(
    request: UpsertCareerProfileRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[CareerProfileResponse]:
    return ApiResponse(data=await career.upsert_profile(auth.user_id, auth.display_name, request))


@router.post("/career/experiences", response_model=ApiResponse[ExperienceResponse])
async def add_experience(
    request: CreateExperienceRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[ExperienceResponse]:
    return ApiResponse(data=await career.add_experience(auth.user_id, request))


@router.delete("/career/experiences/{exp_id}", response_model=ApiResponse[dict])
async def delete_experience(
    exp_id: UUID,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[dict]:
    await career.delete_experience(auth.user_id, exp_id)
    return ApiResponse(data={"deleted": True})


@router.get("/career/people", response_model=ApiResponse[list[PeopleSearchResult]])
async def search_people(
    career: Annotated[CareerService, Depends(get_career_service)],
    q: str | None = Query(default=None),
    sector: str | None = Query(default=None),
    skills: str | None = Query(default=None),
) -> ApiResponse[list[PeopleSearchResult]]:
    return ApiResponse(data=await career.search_people(query=q, sector=sector, skills=skills))


@router.get("/career/jobs", response_model=ApiResponse[list[JobPostingResponse]])
async def list_jobs(
    career: Annotated[CareerService, Depends(get_career_service)],
    auth: Annotated[AuthContext | None, Depends(get_optional_auth_context)],
    sector: str | None = Query(default=None),
    q: str | None = Query(default=None),
) -> ApiResponse[list[JobPostingResponse]]:
    user_id = auth.user_id if auth else None
    return ApiResponse(data=await career.list_jobs(sector=sector, query=q, user_id=user_id))


@router.post("/career/cv/parse", response_model=ApiResponse[CvParseResponse])
async def parse_cv(
    request: CvParseRequest,
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[CvParseResponse]:
    return ApiResponse(data=career.parse_cv(request.cv_url))


@router.post("/career/jobs", response_model=ApiResponse[JobPostingResponse])
async def create_job(
    request: CreateJobRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[JobPostingResponse]:
    return ApiResponse(data=await career.create_job(auth.user_id, request.org_id, request))


@router.get("/career/jobs/org/{org_id}", response_model=ApiResponse[list[JobPostingResponse]])
async def list_org_jobs(
    org_id: UUID,
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[list[JobPostingResponse]]:
    return ApiResponse(data=await career.list_org_jobs(org_id))


@router.post("/career/jobs/{job_id}/apply", response_model=ApiResponse[JobApplicationResponse])
async def apply_to_job(
    job_id: UUID,
    request: ApplyJobRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[JobApplicationResponse]:
    return ApiResponse(data=await career.apply_job(auth.user_id, auth.display_name, job_id, request))


@router.get("/career/jobs/{job_id}/applications", response_model=ApiResponse[list[JobApplicationResponse]])
async def list_applications(
    job_id: UUID,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[list[JobApplicationResponse]]:
    return ApiResponse(data=await career.list_job_applications(auth.user_id, job_id))


@router.patch("/career/jobs/{job_id}/close", response_model=ApiResponse[JobPostingResponse])
@router.post("/career/jobs/{job_id}/close", response_model=ApiResponse[JobPostingResponse])
async def close_job(
    job_id: UUID,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[JobPostingResponse]:
    return ApiResponse(data=await career.close_job(auth.user_id, job_id))


@router.get("/career/shortlist", response_model=ApiResponse[list[TalentShortlistEntry]])
async def list_shortlist(
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[list[TalentShortlistEntry]]:
    return ApiResponse(data=await career.list_shortlist(auth.user_id))


@router.post("/career/shortlist", response_model=ApiResponse[TalentShortlistEntry])
async def add_to_shortlist(
    request: AddToShortlistRequest,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[TalentShortlistEntry]:
    return ApiResponse(data=await career.add_to_shortlist(auth.user_id, request))


@router.delete("/career/shortlist/{candidate_user_id}", response_model=ApiResponse[dict])
async def remove_from_shortlist(
    candidate_user_id: UUID,
    auth: Annotated[AuthContext, Depends(get_auth_context)],
    career: Annotated[CareerService, Depends(get_career_service)],
) -> ApiResponse[dict]:
    await career.remove_from_shortlist(auth.user_id, candidate_user_id)
    return ApiResponse(data={"deleted": True})