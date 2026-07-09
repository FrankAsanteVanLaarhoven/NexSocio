"use client";

import { ModeBadge } from "@nexus/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppIcon, type AppIconName } from "@/components/icons/AppIcon";
import { useTranslation } from "@/i18n";
import { useAuthHydrated } from "@/hooks/useAuthHydrated";
import { useAuthStore } from "@/lib/auth-store";
import { useSettingsStore } from "@/lib/settings-store";

const DOCK: { href: string; labelKey: string; icon: AppIconName }[] = [
  { href: "/feed", labelKey: "nav.feed", icon: "feed" },
  { href: "/twin", labelKey: "nav.twin", icon: "twin" },
  { href: "/studio", labelKey: "nav.studio", icon: "studio" },
  { href: "/live", labelKey: "nav.live", icon: "live" },
  { href: "/status", labelKey: "nav.status", icon: "status" },
  { href: "/calls", labelKey: "nav.calls", icon: "calls" },
  { href: "/teams", labelKey: "nav.teams", icon: "teams" },
  { href: "/contacts", labelKey: "nav.contacts", icon: "contacts" },
  { href: "/hub", labelKey: "nav.hub", icon: "hub" },
  { href: "/marketplace", labelKey: "nav.market", icon: "market" },
  { href: "/map", labelKey: "nav.map", icon: "map" },
  { href: "/find", labelKey: "nav.find", icon: "find" },
  { href: "/connections", labelKey: "nav.connect", icon: "connect" },
  { href: "/inbox", labelKey: "nav.inbox", icon: "inbox" },
  { href: "/settings", labelKey: "nav.settings", icon: "settings" },
];

export function EphemeralHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const hydrated = useAuthHydrated();
  const session = useAuthStore((s) => s.session);
  const viewContext = session?.viewContext ?? "personal";
  const setViewContext = useAuthStore((s) => s.setViewContext);
  const clearSession = useAuthStore((s) => s.clearSession);
  const ephemeralNav = useSettingsStore((s) => s.ephemeralNav);
  const voiceOn = useSettingsStore((s) => s.voiceControlEnabled);

  const [revealed, setRevealed] = useState(!ephemeralNav);
  const [nearTop, setNearTop] = useState(false);

  useEffect(() => {
    if (!ephemeralNav) {
      setRevealed(true);
      return;
    }
    const onScroll = () => setRevealed(window.scrollY > 48);
    const onMove = (e: MouseEvent) => setNearTop(e.clientY < 72);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
    };
  }, [ephemeralNav]);

  const showNav = revealed || nearTop || !ephemeralNav;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ease-out ${
        showNav
          ? "border-b border-subtle backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
      style={showNav ? { backgroundColor: "var(--color-header-bg)" } : undefined}
    >
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-accent bg-accent-muted">
            <span className="text-[10px] font-bold text-accent">NS</span>
          </div>
          <span
            className={`text-sm font-semibold tracking-[0.15em] uppercase text-primary transition-opacity duration-500 ${
              showNav ? "opacity-100" : "opacity-70"
            }`}
          >
            NEXSOCIO
          </span>
        </Link>

        {hydrated && session && (
          <nav
            className={`flex items-center gap-0.5 transition-all duration-500 ${
              showNav ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
            }`}
          >
            {DOCK.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={t(item.labelKey)}
                  className={`flex items-center gap-1 px-2 py-1.5 text-[10px] uppercase tracking-wider rounded-md transition-colors ${
                    active
                      ? "text-accent bg-accent-muted"
                      : "text-faint hover:text-primary hover:bg-surface-elevated"
                  }`}
                >
                  <AppIcon name={item.icon} size={14} className={active ? "text-accent" : "text-faint"} />
                  <span className="hidden md:inline">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {voiceOn && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" title={t("nav.voiceActive")} />
          )}
          {hydrated && !session && (
            <>
              <Link href="/login" className="text-[10px] text-muted hover:text-primary">
                {t("nav.signIn")}
              </Link>
              <Link
                href="/register"
                className="text-[10px] px-2 py-1 rounded border border-accent text-accent"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
          {hydrated && session && (
            <>
              <div className="hidden sm:flex rounded-md border border-default p-0.5">
                {(["personal", "professional"] as const).map((ctx) => (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => setViewContext(ctx)}
                    className={`px-2 py-0.5 text-[9px] uppercase tracking-wider rounded ${
                      viewContext === ctx
                        ? ctx === "professional"
                          ? "bg-[color-mix(in_srgb,var(--color-pro)_15%,transparent)] text-pro"
                          : "bg-accent-muted text-accent"
                        : "text-dim"
                    }`}
                  >
                    {ctx === "personal" ? t("nav.persShort") : t("nav.profShort")}
                  </button>
                ))}
              </div>
              <ModeBadge mode={session.mode} />
              <button
                type="button"
                onClick={clearSession}
                className="text-[10px] text-dim hover:text-primary"
              >
                {t("nav.signOut")}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}