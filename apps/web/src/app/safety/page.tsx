"use client";

import { Panel } from "@nexus/ui";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RegisterFlow } from "@/components/RegisterFlow";
import { getSafetyDashboard } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { SafetyDashboard } from "@nexus/types";

export default function SafetyPage() {
  const session = useAuthStore((s) => s.session);
  const [dashboard, setDashboard] = useState<SafetyDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    getSafetyDashboard()
      .then(setDashboard)
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <AppShell>
        <RegisterFlow onComplete={() => window.location.reload()} />
      </AppShell>
    );
  }

  const metrics = dashboard
    ? [
        { label: "Total Events", value: dashboard.total_events, color: "#00E5FF" },
        { label: "Blocked", value: dashboard.blocked_count, color: "#FF5252" },
        { label: "Under Review", value: dashboard.review_count, color: "#FFB300" },
        { label: "Open Reports", value: dashboard.open_reports, color: "#7C4DFF" },
        { label: "Incident Rate", value: `${dashboard.incident_rate}%`, color: "#4FC3F7" },
      ]
    : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Safety Dashboard</h1>
          <p className="text-xs text-[#8A8A8A] mt-1">
            Multi-layer governance: deterministic rules + ML stub
          </p>
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

            <Panel open title="Recent Moderation Events">
              {dashboard.recent_events.length === 0 ? (
                <p className="text-sm text-[#8A8A8A] text-center py-6">No events yet</p>
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
                        <span className="text-xs text-[#8A8A8A]">score {e.score}</span>
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
    </AppShell>
  );
}