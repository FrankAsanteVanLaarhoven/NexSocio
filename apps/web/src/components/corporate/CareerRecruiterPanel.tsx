"use client";

import type { CorporateSector, JobApplication, JobPosting, OrgNetworkingAccess } from "@nexus/types";
import { Button, Input, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import {
  closeJobPosting,
  createJobPosting,
  listJobApplications,
  listOrgJobs,
} from "@/lib/api";
import { useTranslation } from "@/i18n";

export function CareerRecruiterPanel({
  token,
  orgId,
  orgName,
  sectors,
  networking,
}: {
  token: string;
  orgId: string;
  orgName: string;
  sectors: CorporateSector[];
  networking: OrgNetworkingAccess | undefined;
}) {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sectorCategory, setSectorCategory] = useState("general");
  const [locationType, setLocationType] = useState("hybrid");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [salaryRange, setSalaryRange] = useState("");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    const list = await listOrgJobs(token, orgId);
    setJobs(list);
  }, [token, orgId]);

  useEffect(() => {
    loadJobs().catch(() => setJobs([]));
  }, [loadJobs]);

  async function loadApplications(jobId: string) {
    setSelectedJobId(jobId);
    setLoading(true);
    try {
      const apps = await listJobApplications(token, jobId);
      setApplications(apps);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseJob(jobId: string) {
    setClosingId(jobId);
    setMsg(null);
    try {
      await closeJobPosting(token, jobId);
      setMsg(t("career.jobClosed"));
      if (selectedJobId === jobId) {
        setSelectedJobId(null);
        setApplications([]);
      }
      await loadJobs();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("errors.generic"));
    } finally {
      setClosingId(null);
    }
  }

  async function handlePostJob() {
    if (!title.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await createJobPosting(token, {
        org_id: orgId,
        title: title.trim(),
        description: description.trim(),
        sector_category: sectorCategory,
        location_type: locationType,
        employment_type: employmentType,
        salary_range: salaryRange.trim() || undefined,
        skills_required: skillsRequired.trim() || undefined,
        education_level: educationLevel.trim() || undefined,
      });
      setTitle("");
      setDescription("");
      setSalaryRange("");
      setSkillsRequired("");
      setEducationLevel("");
      setMsg(t("career.jobPosted"));
      await loadJobs();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  if (!networking?.networking_allowed) {
    return (
      <Panel open title={t("career.recruitTitle")}>
        <p className="text-xs text-[#8A8A8A]">{t("corporate.networkingGate")}</p>
        <p className="mt-2 text-xs text-[#5A5A5A]">{networking?.message ?? t("corporate.trialOffer")}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#4FC3F7]/20 bg-[#4FC3F7]/5 p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#4FC3F7]">{t("career.recruitTitle")}</p>
        <p className="mt-1 text-sm text-[#F5F5F5]">{orgName}</p>
        <p className="mt-1 text-xs text-[#8A8A8A]">{t("career.recruitHint")}</p>
      </div>

      <Panel open title={t("career.postJob")}>
        <div className="space-y-3">
          <Input label={t("career.jobTitle")} value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("career.jobDescPlaceholder")}
            rows={4}
            className="w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
          />
          <label className="block text-[10px] uppercase tracking-wider text-[#5A5A5A]">
            {t("corporate.sector")}
            <select
              value={sectorCategory}
              onChange={(e) => setSectorCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
            >
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[10px] uppercase tracking-wider text-[#5A5A5A]">
              {t("career.locationType")}
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
              >
                <option value="remote">{t("career.remote")}</option>
                <option value="hybrid">{t("career.hybrid")}</option>
                <option value="onsite">{t("career.onsite")}</option>
              </select>
            </label>
            <label className="block text-[10px] uppercase tracking-wider text-[#5A5A5A]">
              {t("career.employmentType")}
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
              >
                <option value="full_time">{t("career.fullTime")}</option>
                <option value="part_time">{t("career.partTime")}</option>
                <option value="contract">{t("career.contract")}</option>
                <option value="internship">{t("career.internship")}</option>
              </select>
            </label>
          </div>
          <Input
            label={t("career.salaryRange")}
            value={salaryRange}
            onChange={(e) => setSalaryRange(e.target.value)}
            placeholder="£45k – £60k"
          />
          <Input
            label={t("career.skillsRequired")}
            value={skillsRequired}
            onChange={(e) => setSkillsRequired(e.target.value)}
            placeholder={t("profile.skillsPlaceholder")}
          />
          <Input
            label={t("career.education")}
            value={educationLevel}
            onChange={(e) => setEducationLevel(e.target.value)}
            placeholder="Bachelor's, Master's, etc."
          />
          <Button size="sm" loading={loading} onClick={handlePostJob}>
            {t("career.publishJob")}
          </Button>
        </div>
      </Panel>

      <Panel open title={t("career.yourPostings", { n: jobs.length })}>
        {jobs.length === 0 ? (
          <p className="text-xs text-[#5A5A5A]">{t("career.noPostings")}</p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((job) => (
              <li key={job.id} className="border-b border-[#1F1F1F] py-2">
                <button
                  type="button"
                  onClick={() => loadApplications(job.id)}
                  className={`flex w-full justify-between text-left text-xs ${
                    selectedJobId === job.id ? "text-[#4FC3F7]" : "text-[#F5F5F5]"
                  }`}
                >
                  <span>{job.title}</span>
                  <span
                    className={`text-[10px] ${
                      job.status === "closed" ? "text-[#FFB300]" : "text-[#5A5A5A]"
                    }`}
                  >
                    {job.status}
                  </span>
                </button>
                {job.status !== "closed" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={closingId === job.id}
                    className="mt-1"
                    onClick={() => handleCloseJob(job.id)}
                  >
                    {t("career.closeJob")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {selectedJobId && (
        <Panel open title={t("career.applications", { n: applications.length })}>
          {loading ? (
            <p className="text-xs text-[#8A8A8A]">{t("common.loading")}</p>
          ) : applications.length === 0 ? (
            <p className="text-xs text-[#5A5A5A]">{t("career.noApplications")}</p>
          ) : (
            <ul className="space-y-3">
              {applications.map((app) => (
                <li key={app.id} className="rounded-lg border border-[#1F1F1F] p-3 text-xs">
                  <p className="font-medium text-[#F5F5F5]">{app.applicant_name}</p>
                  <p className="text-[10px] text-[#5A5A5A]">{app.status}</p>
                  {app.cover_note && (
                    <p className="mt-2 text-[#8A8A8A]">{app.cover_note}</p>
                  )}
                  {app.cv_url && (
                    <a
                      href={app.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-[10px] text-[#4FC3F7] hover:underline"
                    >
                      {t("career.downloadCv")}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {msg && <p className="text-xs text-[#00E5FF]">{msg}</p>}
    </div>
  );
}