"use client";

import type { CorporateSector, JobPosting } from "@nexus/types";
import { Button, Input, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import { applyToJob, getCareerProfile, listCareerJobs } from "@/lib/api";
import { useTranslation } from "@/i18n";

export function CareerJobsPanel({
  token,
  sectors,
  initialSector,
}: {
  token: string;
  sectors: CorporateSector[];
  initialSector?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState(initialSector ?? "all");
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const results = await listCareerJobs({
        q: query.trim() || undefined,
        sector: sector === "all" ? undefined : sector,
      });
      setJobs(results);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [query, sector]);

  useEffect(() => {
    if (initialSector) setSector(initialSector);
  }, [initialSector]);

  useEffect(() => {
    loadJobs().catch(() => {});
  }, [loadJobs]);

  async function handleApply(jobId: string) {
    setApplyingId(jobId);
    setMsg(null);
    try {
      const profile = await getCareerProfile(token);
      await applyToJob(token, jobId, {
        cover_note: coverNote.trim() || undefined,
        cv_url: profile.cv_url ?? undefined,
      });
      setMsg(t("career.applied"));
      setCoverNote("");
      setExpandedId(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("errors.generic"));
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#4FC3F7]/20 bg-[#4FC3F7]/5 p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#4FC3F7]">{t("career.nexJobs")}</p>
        <p className="mt-1 text-xs text-[#8A8A8A]">{t("career.jobsHint")}</p>
      </div>

      <Panel open title={t("career.browseJobs")}>
        <div className="mb-3 space-y-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("career.searchJobsPlaceholder")}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSector("all")}
              className={`rounded-md px-2 py-1 text-[10px] border ${
                sector === "all" ? "border-[#4FC3F7]/40 text-[#4FC3F7]" : "border-[#2A2A2A] text-[#8A8A8A]"
              }`}
            >
              {t("common.all")}
            </button>
            {sectors.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSector(s.id)}
                className={`rounded-md px-2 py-1 text-[10px] border ${
                  sector === s.id ? "border-[#4FC3F7]/40 text-[#4FC3F7]" : "border-[#2A2A2A] text-[#8A8A8A]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <Button size="sm" variant="secondary" loading={loading} onClick={loadJobs}>
            {t("common.search")}
          </Button>
        </div>

        {jobs.length === 0 ? (
          <p className="text-xs text-[#5A5A5A]">{loading ? t("common.loading") : t("career.noJobs")}</p>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li key={job.id} className="rounded-lg border border-[#1F1F1F] p-3">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                >
                  <p className="text-sm font-medium text-[#F5F5F5]">{job.title}</p>
                  <p className="text-[10px] text-[#4FC3F7]">
                    {job.org_name} · {job.sector_category}
                    {job.salary_range ? ` · ${job.salary_range}` : ""}
                  </p>
                  <p className="mt-1 text-[10px] text-[#5A5A5A]">
                    {job.employment_type.replace("_", " ")} · {job.location_type}
                  </p>
                </button>

                {expandedId === job.id && (
                  <div className="mt-3 border-t border-[#1F1F1F] pt-3 space-y-2">
                    <p className="text-xs text-[#8A8A8A] whitespace-pre-wrap">{job.description}</p>
                    {job.skills_required && (
                      <p className="text-[10px] text-[#5A5A5A]">
                        {t("career.skillsRequired")}: {job.skills_required}
                      </p>
                    )}
                    {job.education_level && (
                      <p className="text-[10px] text-[#5A5A5A]">
                        {t("career.education")}: {job.education_level}
                      </p>
                    )}
                    <textarea
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder={t("career.coverNotePlaceholder")}
                      rows={2}
                      className="w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-xs text-[#F5F5F5]"
                    />
                    <Button
                      size="sm"
                      loading={applyingId === job.id}
                      onClick={() => handleApply(job.id)}
                    >
                      {t("career.applyOneClick")}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {msg && <p className="text-xs text-[#00E5FF]">{msg}</p>}
    </div>
  );
}