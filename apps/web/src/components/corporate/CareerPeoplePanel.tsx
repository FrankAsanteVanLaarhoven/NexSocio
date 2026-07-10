"use client";

import type { CorporateSector, PeopleSearchResult } from "@nexus/types";
import { Button, Input, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import { addToTalentShortlist, listTalentShortlist, removeFromTalentShortlist, searchCareerPeople } from "@/lib/api";
import { useTranslation } from "@/i18n";

export function CareerPeoplePanel({
  token,
  sectors,
}: {
  token: string;
  sectors: CorporateSector[];
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [skills, setSkills] = useState("");
  const [sector, setSector] = useState("all");
  const [people, setPeople] = useState<PeopleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [shortlistLoadingId, setShortlistLoadingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const results = await searchCareerPeople({
        q: query.trim() || undefined,
        skills: skills.trim() || undefined,
        sector: sector === "all" ? undefined : sector,
      });
      setPeople(results);
      setSearched(true);
    } catch {
      setPeople([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, [query, skills, sector]);

  const loadShortlist = useCallback(async () => {
    try {
      const entries = await listTalentShortlist(token);
      setShortlistedIds(new Set(entries.map((e) => e.candidate_user_id)));
    } catch {
      setShortlistedIds(new Set());
    }
  }, [token]);

  useEffect(() => {
    runSearch().catch(() => {});
  }, [runSearch]);

  useEffect(() => {
    loadShortlist().catch(() => {});
  }, [loadShortlist]);

  async function toggleShortlist(person: PeopleSearchResult) {
    setShortlistLoadingId(person.user_id);
    setMsg(null);
    try {
      if (shortlistedIds.has(person.user_id)) {
        await removeFromTalentShortlist(token, person.user_id);
        setShortlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(person.user_id);
          return next;
        });
        setMsg(t("career.shortlistRemoved"));
      } else {
        await addToTalentShortlist(token, person.user_id);
        setShortlistedIds((prev) => new Set(prev).add(person.user_id));
        setMsg(t("career.shortlistAdded"));
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("errors.generic"));
    } finally {
      setShortlistLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#4FC3F7]/20 bg-[#4FC3F7]/5 p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#4FC3F7]">{t("career.talentSearch")}</p>
        <p className="mt-1 text-xs text-[#8A8A8A]">{t("career.talentSearchHint")}</p>
      </div>

      <Panel open title={t("career.findTalent")}>
        <div className="space-y-3">
          <Input
            label={t("common.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("career.searchPeoplePlaceholder")}
          />
          <Input
            label={t("profile.skills")}
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder={t("profile.skillsPlaceholder")}
          />
          <label className="block text-[10px] uppercase tracking-wider text-[#5A5A5A]">
            {t("corporate.sector")}
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
            >
              <option value="all">{t("common.all")}</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <Button size="sm" loading={loading} onClick={runSearch}>
            {t("career.searchTalent")}
          </Button>
        </div>
      </Panel>

      <Panel open title={t("career.results", { n: people.length })}>
        {loading && !searched ? (
          <p className="text-xs text-[#8A8A8A]">{t("common.loading")}</p>
        ) : people.length === 0 ? (
          <p className="text-xs text-[#5A5A5A]">{t("career.noTalent")}</p>
        ) : (
          <ul className="space-y-3">
            {people.map((p) => (
              <li
                key={p.user_id}
                className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A]/50 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#F5F5F5]">{p.display_name}</p>
                    {p.headline && (
                      <p className="mt-0.5 truncate text-xs text-[#8A8A8A]">{p.headline}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      {p.open_to_work && (
                        <span className="rounded bg-[#00C853]/15 px-1.5 py-0.5 text-[#00C853]">
                          {t("career.openToWork")}
                        </span>
                      )}
                      {p.open_to_contract && (
                        <span className="rounded bg-[#FFB300]/15 px-1.5 py-0.5 text-[#FFB300]">
                          {t("career.openToContract")}
                        </span>
                      )}
                      {p.sector_focus && (
                        <span className="rounded bg-[#4FC3F7]/10 px-1.5 py-0.5 text-[#4FC3F7]">
                          {p.sector_focus}
                        </span>
                      )}
                    </div>
                    {p.skills && (
                      <p className="mt-2 text-[10px] text-[#5A5A5A]">{p.skills}</p>
                    )}
                    {p.location && (
                      <p className="mt-1 text-[10px] text-[#5A5A5A]">📍 {p.location}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right space-y-2">
                    <div>
                      <p className="text-[10px] text-[#5A5A5A]">{t("career.profileStrength")}</p>
                      <p className="text-lg font-bold text-[#4FC3F7]">{p.profile_score}%</p>
                    </div>
                    <Button
                      size="sm"
                      variant={shortlistedIds.has(p.user_id) ? "secondary" : "ghost"}
                      loading={shortlistLoadingId === p.user_id}
                      onClick={() => toggleShortlist(p)}
                    >
                      {shortlistedIds.has(p.user_id) ? t("career.shortlisted") : t("career.shortlist")}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {msg && <p className="text-xs text-[#00E5FF]">{msg}</p>}
    </div>
  );
}