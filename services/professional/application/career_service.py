"""Corporate careers — profiles, CV, experience, jobs, applications (LinkedIn+ beyond)."""

import re
from urllib.parse import unquote, urlparse

from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from services.professional.application.corporate_compliance import CorporateComplianceService
from services.professional.application.dtos import (
    AddToShortlistRequest,
    ApplyJobRequest,
    CareerProfileResponse,
    CreateExperienceRequest,
    CreateJobRequest,
    CvParseResponse,
    ExperienceResponse,
    JobApplicationResponse,
    JobPostingResponse,
    PeopleSearchResult,
    TalentShortlistEntry,
    UpsertCareerProfileRequest,
)
from services.professional.infrastructure.models import (
    CareerProfileModel,
    JobApplicationModel,
    JobPostingModel,
    OrgMembershipModel,
    OrganizationModel,
    TalentShortlistModel,
    WorkExperienceModel,
)


_SKILL_HINTS = (
    "python",
    "javascript",
    "typescript",
    "react",
    "node",
    "sql",
    "aws",
    "docker",
    "kubernetes",
    "java",
    "leadership",
    "project management",
    "accounting",
    "legal",
    "nursing",
    "teaching",
    "marketing",
    "sales",
    "design",
    "data",
)


def job_match_score(user_skills: str | None, job_skills_required: str | None) -> int | None:
    """Compare user skills to job skills_required; returns 0–100 match percentage."""
    if not user_skills or not job_skills_required:
        return None
    user_set = {s.strip().lower() for s in user_skills.split(",") if s.strip()}
    job_set = {s.strip().lower() for s in job_skills_required.split(",") if s.strip()}
    if not job_set:
        return None
    overlap = len(user_set & job_set)
    return round(overlap / len(job_set) * 100)


def _profile_score(headline: str | None, summary: str | None, skills: str | None, cv_url: str | None, exp_count: int) -> int:
    score = 0
    if headline:
        score += 15
    if summary and len(summary) > 40:
        score += 20
    if skills:
        score += min(25, len([s for s in skills.split(",") if s.strip()]) * 5)
    if cv_url:
        score += 25
    score += min(15, exp_count * 5)
    return min(100, score)


class CareerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_profile(self, user_id: UUID, display_name: str = "Member") -> CareerProfileResponse:
        result = await self.db.execute(
            select(CareerProfileModel).where(CareerProfileModel.user_id == user_id)
        )
        row = result.scalar_one_or_none()
        if not row:
            return CareerProfileResponse(
                user_id=user_id,
                display_name=display_name,
                open_to_work=True,
                profile_score=0,
                experiences=[],
            )
        exp = await self._experiences(user_id)
        return self._profile(row, exp)

    async def upsert_profile(
        self, user_id: UUID, display_name: str, request: UpsertCareerProfileRequest
    ) -> CareerProfileResponse:
        result = await self.db.execute(
            select(CareerProfileModel).where(CareerProfileModel.user_id == user_id)
        )
        row = result.scalar_one_or_none()
        data = request.model_dump(exclude_none=True)
        if row:
            for k, v in data.items():
                setattr(row, k, v)
            row.display_name = display_name
        else:
            row = CareerProfileModel(id=uuid4(), user_id=user_id, display_name=display_name, **data)
            self.db.add(row)
        exp = await self._experiences(user_id)
        row.profile_score = _profile_score(row.headline, row.summary, row.skills, row.cv_url, len(exp))
        await self.db.commit()
        await self.db.refresh(row)
        return self._profile(row, exp)

    async def add_experience(self, user_id: UUID, request: CreateExperienceRequest) -> ExperienceResponse:
        exp = WorkExperienceModel(id=uuid4(), user_id=user_id, **request.model_dump())
        self.db.add(exp)
        await self.db.commit()
        await self.db.refresh(exp)
        await self._refresh_score(user_id)
        return self._experience(exp)

    async def delete_experience(self, user_id: UUID, exp_id: UUID) -> None:
        result = await self.db.execute(
            select(WorkExperienceModel).where(
                WorkExperienceModel.id == exp_id,
                WorkExperienceModel.user_id == user_id,
            )
        )
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Experience not found")
        await self.db.delete(row)
        await self.db.commit()
        await self._refresh_score(user_id)

    async def search_people(
        self, query: str | None = None, sector: str | None = None, skills: str | None = None, limit: int = 40
    ) -> list[PeopleSearchResult]:
        stmt = select(CareerProfileModel).where(CareerProfileModel.open_to_work.is_(True))
        if sector:
            stmt = stmt.where(CareerProfileModel.sector_focus == sector)
        if query:
            like = f"%{query.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(CareerProfileModel.display_name).like(like),
                    func.lower(CareerProfileModel.headline).like(like),
                    func.lower(CareerProfileModel.summary).like(like),
                )
            )
        if skills:
            for skill in [s.strip().lower() for s in skills.split(",") if s.strip()]:
                stmt = stmt.where(func.lower(CareerProfileModel.skills).like(f"%{skill}%"))
        stmt = stmt.order_by(CareerProfileModel.profile_score.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return [
            PeopleSearchResult(
                user_id=r.user_id,
                display_name=r.display_name,
                headline=r.headline,
                skills=r.skills,
                location=r.location,
                sector_focus=r.sector_focus,
                profile_score=r.profile_score,
                open_to_work=r.open_to_work,
                open_to_contract=r.open_to_contract,
            )
            for r in result.scalars().all()
        ]

    async def list_jobs(
        self,
        sector: str | None = None,
        query: str | None = None,
        user_id: UUID | None = None,
    ) -> list[JobPostingResponse]:
        user_skills: str | None = None
        if user_id:
            profile_res = await self.db.execute(
                select(CareerProfileModel.skills).where(CareerProfileModel.user_id == user_id)
            )
            user_skills = profile_res.scalar_one_or_none()

        stmt = select(JobPostingModel).where(JobPostingModel.status == "active")
        if sector:
            stmt = stmt.where(JobPostingModel.sector_category == sector)
        if query:
            like = f"%{query.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(JobPostingModel.title).like(like),
                    func.lower(JobPostingModel.description).like(like),
                )
            )
        stmt = stmt.order_by(JobPostingModel.created_at.desc()).limit(100)
        result = await self.db.execute(stmt)
        return [
            self._job(j, match_score=job_match_score(user_skills, j.skills_required) if user_id else None)
            for j in result.scalars().all()
        ]

    @staticmethod
    def parse_cv(cv_url: str) -> CvParseResponse:
        """Heuristic CV parse stub — no external API; infers from URL path and common skill tokens."""
        parsed = urlparse(cv_url.strip())
        path = unquote(parsed.path or "")
        filename = path.rsplit("/", 1)[-1] if path else cv_url
        stem = re.sub(r"\.(pdf|docx?|txt)$", "", filename, flags=re.I)
        stem = stem.replace("-", " ").replace("_", " ").strip()

        headline: str | None = None
        if stem and stem.lower() not in {"cv", "resume", "curriculum vitae"}:
            headline = stem.title()

        lowered = f"{stem} {cv_url}".lower()
        found = [skill for skill in _SKILL_HINTS if skill in lowered]
        skills = ", ".join(found) if found else None

        preview_parts = [p for p in [headline, skills] if p]
        preview = " · ".join(preview_parts) if preview_parts else f"CV uploaded: {filename or cv_url}"

        return CvParseResponse(
            cv_url=cv_url,
            headline=headline,
            skills=skills,
            extracted_preview=preview,
        )

    async def create_job(
        self, user_id: UUID, org_id: UUID, request: CreateJobRequest
    ) -> JobPostingResponse:
        compliance = CorporateComplianceService(self.db)
        access = await compliance.networking_access(org_id)
        if not access.networking_allowed:
            raise HTTPException(status_code=403, detail="Corporate networking subscription required to post jobs")

        mem = await self.db.execute(
            select(OrgMembershipModel).where(
                OrgMembershipModel.org_id == org_id,
                OrgMembershipModel.user_id == user_id,
                OrgMembershipModel.role.in_(("admin", "recruiter", "member")),
            )
        )
        if not mem.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Must be an organisation member to post jobs")

        org_res = await self.db.execute(select(OrganizationModel).where(OrganizationModel.id == org_id))
        org = org_res.scalar_one_or_none()
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")

        job = JobPostingModel(
            id=uuid4(),
            org_id=org_id,
            org_name=org.name,
            posted_by=user_id,
            title=request.title,
            description=request.description,
            sector_category=request.sector_category,
            location_type=request.location_type,
            employment_type=request.employment_type,
            salary_range=request.salary_range,
            skills_required=request.skills_required,
            education_level=request.education_level,
        )
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return self._job(job)

    async def apply_job(
        self, user_id: UUID, display_name: str, job_id: UUID, request: ApplyJobRequest
    ) -> JobApplicationResponse:
        job_res = await self.db.execute(select(JobPostingModel).where(JobPostingModel.id == job_id))
        job = job_res.scalar_one_or_none()
        if not job or job.status != "active":
            raise HTTPException(status_code=404, detail="Job not found")

        profile = await self.get_profile(user_id, display_name)
        cv_url = request.cv_url or profile.cv_url
        if not cv_url and profile.profile_score < 40:
            raise HTTPException(
                status_code=400,
                detail="Upload a CV or complete your profile (headline, skills, experience) before applying",
            )

        existing = await self.db.execute(
            select(JobApplicationModel).where(
                JobApplicationModel.job_id == job_id,
                JobApplicationModel.applicant_id == user_id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Already applied to this job")

        app = JobApplicationModel(
            id=uuid4(),
            job_id=job_id,
            applicant_id=user_id,
            applicant_name=display_name,
            cover_note=request.cover_note,
            cv_url=cv_url,
        )
        self.db.add(app)
        await self.db.commit()
        await self.db.refresh(app)
        return self._application(app)

    async def list_org_jobs(self, org_id: UUID) -> list[JobPostingResponse]:
        result = await self.db.execute(
            select(JobPostingModel)
            .where(JobPostingModel.org_id == org_id)
            .order_by(JobPostingModel.created_at.desc())
        )
        return [self._job(j) for j in result.scalars().all()]

    async def close_job(self, user_id: UUID, job_id: UUID) -> JobPostingResponse:
        job_res = await self.db.execute(select(JobPostingModel).where(JobPostingModel.id == job_id))
        job = job_res.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if job.status == "closed":
            return self._job(job)
        if not await self._can_manage_job(user_id, job):
            raise HTTPException(status_code=403, detail="Recruiter access required")

        job.status = "closed"
        await self.db.commit()
        await self.db.refresh(job)
        return self._job(job)

    async def add_to_shortlist(
        self, recruiter_user_id: UUID, request: AddToShortlistRequest
    ) -> TalentShortlistEntry:
        if recruiter_user_id == request.candidate_user_id:
            raise HTTPException(status_code=400, detail="Cannot shortlist yourself")

        profile_res = await self.db.execute(
            select(CareerProfileModel).where(CareerProfileModel.user_id == request.candidate_user_id)
        )
        profile = profile_res.scalar_one_or_none()
        if not profile:
            raise HTTPException(status_code=404, detail="Candidate profile not found")

        existing = await self.db.execute(
            select(TalentShortlistModel).where(
                TalentShortlistModel.recruiter_user_id == recruiter_user_id,
                TalentShortlistModel.candidate_user_id == request.candidate_user_id,
            )
        )
        row = existing.scalar_one_or_none()
        if row:
            return self._shortlist_entry(row, profile)

        row = TalentShortlistModel(
            id=uuid4(),
            recruiter_user_id=recruiter_user_id,
            candidate_user_id=request.candidate_user_id,
        )
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return self._shortlist_entry(row, profile)

    async def list_shortlist(self, recruiter_user_id: UUID) -> list[TalentShortlistEntry]:
        result = await self.db.execute(
            select(TalentShortlistModel, CareerProfileModel)
            .join(
                CareerProfileModel,
                CareerProfileModel.user_id == TalentShortlistModel.candidate_user_id,
            )
            .where(TalentShortlistModel.recruiter_user_id == recruiter_user_id)
            .order_by(TalentShortlistModel.created_at.desc())
        )
        return [self._shortlist_entry(row, profile) for row, profile in result.all()]

    async def remove_from_shortlist(self, recruiter_user_id: UUID, candidate_user_id: UUID) -> None:
        result = await self.db.execute(
            select(TalentShortlistModel).where(
                TalentShortlistModel.recruiter_user_id == recruiter_user_id,
                TalentShortlistModel.candidate_user_id == candidate_user_id,
            )
        )
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail="Shortlist entry not found")
        await self.db.delete(row)
        await self.db.commit()

    async def list_job_applications(self, user_id: UUID, job_id: UUID) -> list[JobApplicationResponse]:
        job_res = await self.db.execute(select(JobPostingModel).where(JobPostingModel.id == job_id))
        job = job_res.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        if not await self._can_manage_job(user_id, job):
            raise HTTPException(status_code=403, detail="Recruiter access required")

        result = await self.db.execute(
            select(JobApplicationModel)
            .where(JobApplicationModel.job_id == job_id)
            .order_by(JobApplicationModel.created_at.desc())
        )
        return [self._application(a) for a in result.scalars().all()]

    async def _can_manage_job(self, user_id: UUID, job: JobPostingModel) -> bool:
        if job.posted_by == user_id:
            return True
        mem = await self.db.execute(
            select(OrgMembershipModel).where(
                OrgMembershipModel.org_id == job.org_id,
                OrgMembershipModel.user_id == user_id,
                OrgMembershipModel.role.in_(("admin", "recruiter")),
            )
        )
        return mem.scalar_one_or_none() is not None

    @staticmethod
    def _shortlist_entry(row: TalentShortlistModel, profile: CareerProfileModel) -> TalentShortlistEntry:
        return TalentShortlistEntry(
            id=row.id,
            candidate_user_id=row.candidate_user_id,
            display_name=profile.display_name,
            headline=profile.headline,
            profile_score=profile.profile_score,
            created_at=row.created_at,
        )

    async def _experiences(self, user_id: UUID) -> list[WorkExperienceModel]:
        result = await self.db.execute(
            select(WorkExperienceModel)
            .where(WorkExperienceModel.user_id == user_id)
            .order_by(WorkExperienceModel.is_current.desc(), WorkExperienceModel.start_year.desc())
        )
        return list(result.scalars().all())

    async def _refresh_score(self, user_id: UUID) -> None:
        result = await self.db.execute(
            select(CareerProfileModel).where(CareerProfileModel.user_id == user_id)
        )
        row = result.scalar_one_or_none()
        if not row:
            return
        exp = await self._experiences(user_id)
        row.profile_score = _profile_score(row.headline, row.summary, row.skills, row.cv_url, len(exp))
        await self.db.commit()

    @staticmethod
    def _experience(e: WorkExperienceModel) -> ExperienceResponse:
        return ExperienceResponse(
            id=e.id,
            company=e.company,
            title=e.title,
            location=e.location,
            start_year=e.start_year,
            end_year=e.end_year,
            is_current=e.is_current,
            description=e.description,
            sector=e.sector,
        )

    def _profile(self, row: CareerProfileModel, experiences: list[WorkExperienceModel]) -> CareerProfileResponse:
        return CareerProfileResponse(
            user_id=row.user_id,
            display_name=row.display_name,
            headline=row.headline,
            summary=row.summary,
            skills=row.skills,
            cv_url=row.cv_url,
            cv_filename=row.cv_filename,
            location=row.location,
            sector_focus=row.sector_focus,
            open_to_work=row.open_to_work,
            open_to_contract=row.open_to_contract,
            profile_score=row.profile_score,
            experiences=[self._experience(e) for e in experiences],
        )

    @staticmethod
    def _job(j: JobPostingModel, match_score: int | None = None) -> JobPostingResponse:
        return JobPostingResponse(
            id=j.id,
            org_id=j.org_id,
            org_name=j.org_name,
            title=j.title,
            description=j.description,
            sector_category=j.sector_category,
            location_type=j.location_type,
            employment_type=j.employment_type,
            salary_range=j.salary_range,
            skills_required=j.skills_required,
            education_level=j.education_level,
            status=j.status,
            created_at=j.created_at,
            match_score=match_score,
        )

    @staticmethod
    def _application(a: JobApplicationModel) -> JobApplicationResponse:
        return JobApplicationResponse(
            id=a.id,
            job_id=a.job_id,
            applicant_id=a.applicant_id,
            applicant_name=a.applicant_name,
            cover_note=a.cover_note,
            cv_url=a.cv_url,
            status=a.status,
            created_at=a.created_at,
        )