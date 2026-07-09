"use client";

import Link from "next/link";
import { Panel } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useTranslation } from "@/i18n";
import { useAuthStore } from "@/lib/auth-store";
import { useSettingsRegistry } from "@/lib/use-settings-registry";

export function SettingsSectionShell({
  section,
  children,
}: {
  section: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const { sectionMeta } = useSettingsRegistry();
  const meta = sectionMeta[section] || { title: section, subtitle: "" };

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-4">
            <div className="flex items-center gap-3">
              <Link href="/settings" className="text-xs text-muted hover:text-accent">
                {t("common.backToSettings")}
              </Link>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-primary">{meta.title}</h1>
              {meta.subtitle && <p className="text-xs text-muted mt-1">{meta.subtitle}</p>}
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
    <div className="rounded-lg border border-subtle px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-primary">{label}</p>
          {hint && <p className="text-[10px] text-dim mt-0.5">{hint}</p>}
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
      className="flex w-full items-center justify-between rounded-lg border border-default px-4 py-3 text-left hover:border-[var(--color-border-hover)] transition-colors"
    >
      <div>
        <p className="text-sm text-[#F5F5F5]">{label}</p>
        {hint && <p className="text-[10px] text-[#5A5A5A] mt-0.5">{hint}</p>}
      </div>
      <div className={`h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-[var(--color-border)]"}`}>
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
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onConnect}
      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
        connected ? "border-[color-mix(in_srgb,var(--color-success)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_5%,transparent)]" : "border-default hover:border-[var(--color-border-hover)]"
      }`}
    >
      <span className="text-sm text-primary">{name}</span>
      <span className={`text-[10px] uppercase ${connected ? "text-success" : "text-dim"}`}>
        {connected ? t("common.connected") : t("common.connect")}
      </span>
    </button>
  );
}

export function StatCard({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <div className="rounded-lg border border-subtle bg-surface p-4 text-center">
      <p className="text-[10px] uppercase tracking-wider text-dim">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-accent">{value}</p>
      {trend && <p className="text-[10px] text-success mt-1">{trend}</p>}
    </div>
  );
}