"use client";

import type {
  CorporateComplianceStatus,
  CorporateSector,
  CorporateServiceListing,
  OrgMembership,
  OrgNetworkingAccess,
} from "@nexus/types";
import { Button, Input, Panel } from "@nexus/ui";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { CareerJobsPanel } from "@/components/corporate/CareerJobsPanel";
import { CareerPeoplePanel } from "@/components/corporate/CareerPeoplePanel";
import { CareerProfilePanel } from "@/components/corporate/CareerProfilePanel";
import { CareerRecruiterPanel } from "@/components/corporate/CareerRecruiterPanel";
import {
  createCorporateService,
  createOrganization,
  getCorporateDashboard,
  listCorporateSectors,
  listOrgMemberships,
  listPublicCorporateServices,
  startNetworkingTrial,
  submitOrgCredentials,
  verifyOrgEmail,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/i18n";

export default function CorporatePage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const setActiveSector = useAuthStore((s) => s.setActiveSector);

  const [sectors, setSectors] = useState<CorporateSector[]>([]);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [compliance, setCompliance] = useState<CorporateComplianceStatus[]>([]);
  const [networking, setNetworking] = useState<OrgNetworkingAccess[]>([]);
  const [publicServices, setPublicServices] = useState<CorporateServiceListing[]>([]);
  const [insights, setInsights] = useState<{ label: string; value: string }[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState("all");
  const [tab, setTab] = useState<
    "profile" | "people" | "jobs" | "recruit" | "companies" | "services"
  >("profile");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [corporateEmail, setCorporateEmail] = useState("");
  const [sectorCategory, setSectorCategory] = useState("general");
  const [regNumber, setRegNumber] = useState("");
  const [licenseBody, setLicenseBody] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeCompliance = compliance.find((c) => c.org_id === activeOrgId);
  const activeNetworking = networking.find((n) => n.org_id === activeOrgId);

  async function refresh() {
    if (!session) return;
    const [dash, services] = await Promise.all([
      getCorporateDashboard(session.accessToken),
      listPublicCorporateServices(sectorFilter === "all" ? undefined : sectorFilter),
    ]);
    setMemberships(dash.memberships);
    setCompliance(dash.compliance ?? []);
    setNetworking(dash.networking_access ?? []);
    setInsights(dash.insights.map((i) => ({ label: i.label, value: i.value })));
    if (!activeOrgId && dash.memberships[0]) setActiveOrgId(dash.memberships[0].org_id);
    setPublicServices(services);
  }

  useEffect(() => {
    if (!session) return;
    setActiveSector("business_corporate");
    listCorporateSectors().then(setSectors).catch(() => setSectors([]));
    refresh().catch(() => {});
  }, [session, setActiveSector, sectorFilter]);

  async function handleCreateOrg() {
    if (!session || !name.trim() || !slug.trim() || !corporateEmail.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const org = await createOrganization(session.accessToken, {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        corporate_email: corporateEmail.trim().toLowerCase(),
        sector_category: sectorCategory,
      });
      setMsg(t("corporate.orgCreated"));
      setName("");
      setSlug("");
      setCorporateEmail("");
      setActiveOrgId(org.id);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("corporate.orgFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmail() {
    if (!session || !activeOrgId || !corporateEmail.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await verifyOrgEmail(session.accessToken, activeOrgId, corporateEmail.trim().toLowerCase());
      setMsg(t("corporate.emailVerified"));
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("corporate.verifyFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleCredentials() {
    if (!session || !activeOrgId || !regNumber.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await submitOrgCredentials(session.accessToken, activeOrgId, {
        sector_category: sectorCategory,
        registration_number: regNumber.trim(),
        license_body: licenseBody.trim() || undefined,
      });
      setMsg(t("corporate.credentialsApproved"));
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("corporate.credentialsFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleTrial() {
    if (!session || !activeOrgId) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await startNetworkingTrial(session.accessToken, activeOrgId);
      setMsg(res.message);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("corporate.trialFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleService() {
    if (!session || !activeOrgId || !serviceTitle.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await createCorporateService(session.accessToken, activeOrgId, {
        title: serviceTitle.trim(),
        description: serviceDesc.trim(),
        price_hint: servicePrice.trim() || undefined,
      });
      setMsg(t("corporate.servicePublished"));
      setServiceTitle("");
      setServiceDesc("");
      setServicePrice("");
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("corporate.serviceFailed"));
    } finally {
      setLoading(false);
    }
  }

  const activeOrgName = memberships.find((m) => m.org_id === activeOrgId)?.org_name ?? "";

  const tabs = [
    { id: "profile" as const, label: t("corporate.tabProfile") },
    { id: "people" as const, label: t("corporate.tabPeople") },
    { id: "jobs" as const, label: t("corporate.tabJobs") },
    { id: "recruit" as const, label: t("corporate.tabRecruit") },
    { id: "companies" as const, label: t("corporate.tabCompanies") },
    { id: "services" as const, label: t("corporate.tabServices") },
  ];

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
              <p className="mt-2 text-[10px] text-[#4FC3F7]">{t("corporate.policyHint")}</p>
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

            <div className="flex flex-wrap gap-2 border-b border-[#1F1F1F] pb-2 text-xs">
              {tabs.map((tb) => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setTab(tb.id)}
                  className={`rounded-md px-3 py-1.5 ${
                    tab === tb.id ? "bg-[#4FC3F7]/15 text-[#4FC3F7]" : "text-[#5A5A5A]"
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            {tab === "companies" && (
              <>
                <Panel open title={t("corporate.yourCompanies")}>
                  {memberships.length === 0 ? (
                    <p className="text-xs text-[#8A8A8A]">{t("sector.noOrg")}</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {memberships.map((m) => {
                        const c = compliance.find((x) => x.org_id === m.org_id);
                        return (
                          <li key={m.org_id}>
                            <button
                              type="button"
                              onClick={() => setActiveOrgId(m.org_id)}
                              className={`flex w-full justify-between border-b border-[#1F1F1F] py-2 text-left ${
                                activeOrgId === m.org_id ? "text-[#4FC3F7]" : "text-[#F5F5F5]"
                              }`}
                            >
                              <span>{m.org_name}</span>
                              <span className="text-[10px] uppercase text-[#5A5A5A]">
                                {c?.can_serve_public ? t("corporate.verified") : t("corporate.pending")}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Panel>

                {activeOrgId && activeCompliance && (
                  <Panel open title={t("corporate.complianceTitle")}>
                    <div className="space-y-2 text-xs text-[#8A8A8A]">
                      <p>
                        {t("corporate.emailStatus")}:{" "}
                        <span className={activeCompliance.email_verified ? "text-[#00C853]" : "text-[#FFB300]"}>
                          {activeCompliance.email_verified ? t("corporate.verified") : t("corporate.pending")}
                        </span>
                      </p>
                      <p>
                        {t("corporate.credentialsStatus")}:{" "}
                        <span className={activeCompliance.credentials_verified ? "text-[#00C853]" : "text-[#FFB300]"}>
                          {activeCompliance.credentials_verified ? t("corporate.verified") : t("corporate.pending")}
                        </span>
                      </p>
                      <p>
                        {t("corporate.publicSelling")}:{" "}
                        <span className={activeCompliance.can_serve_public ? "text-[#00C853]" : "text-[#FFB300]"}>
                          {activeCompliance.can_serve_public ? t("corporate.enabled") : t("corporate.locked")}
                        </span>
                      </p>
                      <p>
                        {t("corporate.networkingStatus")}:{" "}
                        <span className={activeNetworking?.networking_allowed ? "text-[#00C853]" : "text-[#FFB300]"}>
                          {activeNetworking?.message ?? activeCompliance.subscription_status}
                        </span>
                      </p>
                    </div>
                    <div className="mt-3 space-y-2">
                      <Input
                        label={t("corporate.corporateEmail")}
                        value={corporateEmail}
                        onChange={(e) => setCorporateEmail(e.target.value)}
                        placeholder={`you@${activeCompliance.email_domain ?? "company.com"}`}
                      />
                      {!activeCompliance.email_verified && (
                        <Button size="sm" loading={loading} onClick={handleVerifyEmail}>
                          {t("corporate.verifyEmail")}
                        </Button>
                      )}
                      {activeCompliance.email_verified && !activeCompliance.credentials_verified && (
                        <>
                          <Input
                            label={t("corporate.registrationNumber")}
                            value={regNumber}
                            onChange={(e) => setRegNumber(e.target.value)}
                          />
                          <Input
                            label={t("corporate.licenseBody")}
                            value={licenseBody}
                            onChange={(e) => setLicenseBody(e.target.value)}
                            placeholder="Companies House, SRA, CQC, etc."
                          />
                          <Button size="sm" loading={loading} onClick={handleCredentials}>
                            {t("corporate.submitCredentials")}
                          </Button>
                        </>
                      )}
                      {activeCompliance.can_serve_public && !activeNetworking?.networking_allowed && (
                        <Button size="sm" variant="secondary" loading={loading} onClick={handleTrial}>
                          {t("corporate.startTrial")}
                        </Button>
                      )}
                    </div>
                  </Panel>
                )}

                <Panel open title={t("corporate.createCompany")}>
                  <div className="space-y-3">
                    <Input label={t("corporate.companyName")} value={name} onChange={(e) => setName(e.target.value)} />
                    <Input
                      label={t("corporate.slug")}
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())}
                      placeholder="acme-corp"
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
                    <Input
                      label={t("corporate.corporateEmail")}
                      value={corporateEmail}
                      onChange={(e) => setCorporateEmail(e.target.value)}
                      placeholder="admin@yourcompany.com"
                    />
                    <p className="text-[10px] text-[#5A5A5A]">{t("corporate.emailRule")}</p>
                    <Button className="w-full" loading={loading} onClick={handleCreateOrg}>
                      {t("corporate.createCompany")}
                    </Button>
                  </div>
                </Panel>
              </>
            )}

            {tab === "services" && (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSectorFilter("all")}
                    className={`rounded-md px-2 py-1 text-[10px] border ${
                      sectorFilter === "all" ? "border-[#4FC3F7]/40 text-[#4FC3F7]" : "border-[#2A2A2A] text-[#8A8A8A]"
                    }`}
                  >
                    {t("common.all")}
                  </button>
                  {sectors.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSectorFilter(s.id)}
                      className={`rounded-md px-2 py-1 text-[10px] border ${
                        sectorFilter === s.id ? "border-[#4FC3F7]/40 text-[#4FC3F7]" : "border-[#2A2A2A] text-[#8A8A8A]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <Panel open title={t("corporate.publicServices")}>
                  <p className="mb-3 text-xs text-[#8A8A8A]">{t("corporate.publicServicesHint")}</p>
                  {publicServices.length === 0 ? (
                    <p className="text-xs text-[#5A5A5A]">{t("corporate.noServices")}</p>
                  ) : (
                    <ul className="space-y-3">
                      {publicServices.map((s) => (
                        <li key={s.id} className="border-b border-[#1F1F1F] pb-2">
                          <p className="text-sm font-medium text-[#F5F5F5]">{s.title}</p>
                          <p className="text-[10px] text-[#4FC3F7]">
                            {s.org_name} · {s.sector_category}
                            {s.price_hint ? ` · ${s.price_hint}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-[#8A8A8A]">{s.description}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
                {activeCompliance?.can_serve_public && (
                  <Panel open title={t("corporate.addService")}>
                    <div className="space-y-2">
                      <Input label={t("corporate.serviceTitle")} value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} />
                      <Input label={t("corporate.serviceDesc")} value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} />
                      <Input label={t("corporate.servicePrice")} value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} placeholder="From £99" />
                      <Button size="sm" loading={loading} onClick={handleService}>
                        {t("corporate.publishService")}
                      </Button>
                    </div>
                  </Panel>
                )}
              </>
            )}

            {tab === "profile" && session && (
              <CareerProfilePanel token={session.accessToken} sectors={sectors} />
            )}

            {tab === "people" && (
              activeNetworking?.networking_allowed ? (
                <CareerPeoplePanel sectors={sectors} />
              ) : (
                <Panel open title={t("corporate.tabPeople")}>
                  <div className="space-y-2 text-xs text-[#8A8A8A]">
                    <p>{t("corporate.networkingGate")}</p>
                    <p>{t("corporate.trialOffer")}</p>
                    {activeOrgId && activeCompliance?.can_serve_public && (
                      <Button size="sm" loading={loading} onClick={handleTrial}>
                        {t("corporate.startTrial")}
                      </Button>
                    )}
                  </div>
                </Panel>
              )
            )}

            {tab === "jobs" && session && (
              <CareerJobsPanel token={session.accessToken} sectors={sectors} />
            )}

            {tab === "recruit" && session && (
              activeOrgId ? (
                <CareerRecruiterPanel
                  token={session.accessToken}
                  orgId={activeOrgId}
                  orgName={activeOrgName}
                  sectors={sectors}
                  networking={activeNetworking}
                />
              ) : (
                <Panel open title={t("corporate.tabRecruit")}>
                  <p className="text-xs text-[#8A8A8A]">{t("sector.noOrg")}</p>
                </Panel>
              )
            )}

            {msg && <p className="text-xs text-[#00E5FF]">{msg}</p>}
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}