"use client";

import Link from "next/link";
import { Panel } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useAuthStore } from "@/lib/auth-store";
import { SECTION_META } from "@/lib/settings-registry";

export function SettingsSectionShell({
  section,
  children,
}: {
  section: string;
  children: React.ReactNode;
}) {
  const session = useAuthStore((s) => s.session);
  const meta = SECTION_META[section] || { title: section, subtitle: "" };

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-4">
            <div className="flex items-center gap-3">
              <Link href="/settings" className="text-xs text-[#8A8A8A] hover:text-[#00E5FF]">
                ← Settings
              </Link>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">{meta.title}</h1>
              {meta.subtitle && <p className="text-xs text-[#8A8A8A] mt-1">{meta.subtitle}</p>}
            </div>
            {children}
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}

export function SettingRow({
  label,
  hint,
  action,
  children,
}: {
  label: string;
  hint?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#1F1F1F] px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#F5F5F5]">{label}</p>
          {hint && <p className="text-[10px] text-[#5A5A5A] mt-0.5">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function SettingToggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between rounded-lg border border-[#2A2A2A] px-4 py-3 text-left hover:border-[#3A3A3A] transition-colors"
    >
      <div>
        <p className="text-sm text-[#F5F5F5]">{label}</p>
        {hint && <p className="text-[10px] text-[#5A5A5A] mt-0.5">{hint}</p>}
      </div>
      <div className={`h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-[#00E5FF]" : "bg-[#2A2A2A]"}`}>
        <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0"}`} />
      </div>
    </button>
  );
}

export function ConnectorButton({
  name,
  connected,
  onConnect,
}: {
  name: string;
  connected: boolean;
  onConnect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onConnect}
      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
        connected ? "border-[#00C853]/40 bg-[#00C853]/5" : "border-[#2A2A2A] hover:border-[#3A3A3A]"
      }`}
    >
      <span className="text-sm text-[#F5F5F5]">{name}</span>
      <span className={`text-[10px] uppercase ${connected ? "text-[#00C853]" : "text-[#5A5A5A]"}`}>
        {connected ? "Connected" : "Connect"}
      </span>
    </button>
  );
}

export function StatCard({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-4 text-center">
      <p className="text-[10px] uppercase tracking-wider text-[#5A5A5A]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#00E5FF]">{value}</p>
      {trend && <p className="text-[10px] text-[#00C853] mt-1">{trend}</p>}
    </div>
  );
}