"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import {
  createOrganization,
  getCorporateDashboard,
  listOrganizations,
  listOrgMemberships,
} from "@/lib/api";
import type { Organization, OrgMembership } from "@nexus/types";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/i18n";

export default function CorporatePage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const setActiveSector = useAuthStore((s) => s.setActiveSector);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [insights, setInsights] = useState<{ label: string; value: string }[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [industry, setIndustry] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    setActiveSector("business_corporate");
    listOrganizations()
      .then(setOrgs)
      .catch(() => setOrgs([]));
    listOrgMemberships(session.accessToken)
      .then(setMemberships)
      .catch(() => setMemberships([]));
    getCorporateDashboard(session.accessToken)
      .then((d) => setInsights(d.insights.map((i) => ({ label: i.label, value: i.value }))))
      .catch(() => setInsights([]));
  }, [session, setActiveSector]);

  async function handleCreateOrg() {
    if (!session || !name.trim() || !slug.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await createOrganization(session.accessToken, {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        industry: industry.trim() || undefined,
      });
      setMsg(t("corporate.orgCreated"));
      setName("");
      setSlug("");
      setIndustry("");
      setOrgs(await listOrganizations());
      setMemberships(await listOrgMemberships(session.accessToken));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("corporate.orgFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">{t("corporate.title")}</h1>
              <p className="mt-1 text-xs text-[#8A8A8A]">{t("corporate.subtitle")}</p>
            </div>

            {insights.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {insights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-[#4FC3F7]/20 bg-[#4FC3F7]/5 p-3 text-center"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-[#5A5A5A]">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold text-[#4FC3F7]">{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 border-b border-[#1F1F1F] pb-2 text-xs">
              <span className="rounded-md bg-[#4FC3F7]/15 px-3 py-1.5 text-[#4FC3F7]">
                {t("corporate.tabCompanies")}
              </span>
              <span className="px-3 py-1.5 text-[#5A5A5A]">{t("corporate.tabPeople")}</span>
              <span className="px-3 py-1.5 text-[#5A5A5A]">{t("corporate.tabJobs")}</span>
            </div>

            <Panel open title={t("corporate.yourCompanies")}>
              {memberships.length === 0 ? (
                <p className="text-xs text-[#8A8A8A]">{t("sector.noOrg")}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {memberships.map((m) => (
                    <li key={m.org_id} className="flex justify-between border-b border-[#1F1F1F] py-2">
                      <span className="text-[#F5F5F5]">{m.org_name}</span>
                      <span className="text-[10px] uppercase text-[#5A5A5A]">{m.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel open title={t("corporate.createCompany")}>
              <div className="space-y-3">
                <Input label={t("corporate.companyName")} value={name} onChange={(e) => setName(e.target.value)} />
                <Input
                  label={t("corporate.slug")}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())}
                  placeholder="acme-corp"
                />
                <Input
                  label={t("corporate.industry")}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Technology"
                />
                <Button className="w-full" loading={loading} onClick={handleCreateOrg}>
                  {t("corporate.createCompany")}
                </Button>
              </div>
            </Panel>

            <Panel open title={t("corporate.discover")}>
              <ul className="space-y-2 text-sm">
                {orgs.map((org) => (
                  <li key={org.id} className="border-b border-[#1F1F1F] py-2">
                    <p className="font-medium text-[#F5F5F5]">{org.name}</p>
                    <p className="text-[10px] text-[#5A5A5A]">
                      {org.industry ?? t("corporate.industryUnknown")} · @{org.slug}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>

            {msg && <p className="text-xs text-[#00C853]">{msg}</p>}
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}