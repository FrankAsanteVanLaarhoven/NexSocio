"use client";

import { Panel } from "@nexus/ui";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { getSafetyDashboard } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/i18n";
import type { SafetyDashboard } from "@nexus/types";

export default function SafetyPage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const [dashboard, setDashboard] = useState<SafetyDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    getSafetyDashboard()
      .then(setDashboard)
      .finally(() => setLoading(false));
  }, [session]);

  const metrics = dashboard
    ? [
        { label: t("safety.totalEvents"), value: dashboard.total_events, color: "#00E5FF" },
        { label: t("safety.blocked"), value: dashboard.blocked_count, color: "#FF5252" },
        { label: t("safety.underReview"), value: dashboard.review_count, color: "#FFB300" },
        { label: t("safety.openReports"), value: dashboard.open_reports, color: "#7C4DFF" },
        { label: t("safety.incidentRate"), value: `${dashboard.incident_rate}%`, color: "#4FC3F7" },
      ]
    : [];

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">{t("safety.title")}</h1>
          <p className="text-xs text-[#8A8A8A] mt-1">{t("safety.subtitle")}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
          </div>
        ) : dashboard ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-4 text-center"
                >
                  <p className="text-[10px] uppercase tracking-wider text-[#5A5A5A]">{m.label}</p>
                  <p className="mt-1 text-xl font-semibold" style={{ color: m.color }}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            <Panel open title={t("safety.recentEvents")}>
              {dashboard.recent_events.length === 0 ? (
                <p className="text-sm text-[#8A8A8A] text-center py-6">{t("safety.noEvents")}</p>
              ) : (
                <div className="space-y-2">
                  {dashboard.recent_events.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between rounded-md border border-[#1F1F1F] px-3 py-2"
                    >
                      <div>
                        <span className="text-xs text-[#F5F5F5]">{e.action}</span>
                        <span className="ml-2 text-[10px] text-[#5A5A5A]">{e.labels}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#8A8A8A]">{t("safety.score", { n: e.score })}</span>
                        <p className="text-[10px] text-[#5A5A5A]">
                          {new Date(e.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </>
        ) : null}
      </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}