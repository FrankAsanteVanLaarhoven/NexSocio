"use client";

import Link from "next/link";
import { useState } from "react";
import { Panel } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { AppIcon, resolveIconName, type AppIconName } from "@/components/icons/AppIcon";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/i18n";
import { useSettingsRegistry } from "@/lib/use-settings-registry";

type SectorFilter = "personal" | "professional" | "all";

export default function SettingsPage() {
  const session = useAuthStore((s) => s.session);
  const viewContext = session?.viewContext ?? "personal";
  const [sector, setSector] = useState<SectorFilter>(
    viewContext === "professional" ? "professional" : "personal"
  );
  const [query, setQuery] = useState("");

  const { t } = useTranslation();
  const { groupsForSector } = useSettingsRegistry();
  const groups = groupsForSector(sector).map((g) => ({
    ...g,
    items: g.items.filter(
      (i) =>
        !query.trim() ||
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.description?.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-2xl space-y-5 pb-12">
            <div>
              <h1 className="text-xl font-semibold text-primary">{t("settings.title")}</h1>
              <p className="text-xs text-muted mt-1">
                {t("settings.subtitle")}
              </p>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("settings.searchPlaceholder")}
              className="w-full rounded-lg border border-default bg-base px-4 py-2.5 text-sm text-primary placeholder:text-dim"
            />

            <div className="flex gap-1 p-1 rounded-lg border border-subtle bg-base">
              {(["personal", "professional", "all"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSector(s)}
                  className={`flex-1 py-2 text-xs capitalize rounded-md transition-colors ${
                    sector === s
                      ? s === "professional"
                        ? "bg-[color-mix(in_srgb,var(--color-pro)_15%,transparent)] text-pro"
                        : "bg-accent-muted text-accent"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  {t(s === "all" ? "settings.sectorAll" : s === "personal" ? "common.personal" : "common.professional")}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { href: "/inbox", icon: "inbox" as AppIconName, labelKey: "settings.quickInbox" },
                { href: "/wallet", icon: "wallet" as AppIconName, labelKey: "settings.quickWallet" },
                { href: "/shop", icon: "shop" as AppIconName, labelKey: "settings.quickShop" },
                { href: "/settings/analytics", icon: "stats" as AppIconName, labelKey: "settings.quickStats" },
              ].map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex flex-col items-center gap-1 rounded-lg border border-subtle py-3 hover:border-accent transition-colors"
                >
                  <AppIcon name={q.icon} size={20} className="text-accent" />
                  <span className="text-[10px] text-muted">{t(q.labelKey)}</span>
                </Link>
              ))}
            </div>

            {groups.map((group) => (
              <Panel
                key={group.id}
                open
                title={group.title}
                subtitle={group.subtitle}
                className={
                  group.sector === "professional" ? "border-[color-mix(in_srgb,var(--color-pro)_20%,transparent)]" : undefined
                }
              >
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-elevated transition-colors group"
                    >
                      {item.icon && (
                        <span className="w-8 h-8 flex items-center justify-center rounded-md border border-default shrink-0 group-hover:border-accent">
                          <AppIcon
                            name={resolveIconName(item.icon) ?? (item.icon as AppIconName)}
                            size={16}
                            className="text-muted group-hover:text-accent"
                          />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-primary">{item.label}</p>
                        {item.description && (
                          <p className="text-[10px] text-dim truncate">{item.description}</p>
                        )}
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] text-danger">
                          {item.badge}
                        </span>
                      )}
                      <span className="text-dim text-xs">›</span>
                    </Link>
                  ))}
                </div>
              </Panel>
            ))}
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}