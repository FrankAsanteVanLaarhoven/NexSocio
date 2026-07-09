"use client";

import { ModeBadge } from "@nexus/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n";
import { useAuthHydrated } from "@/hooks/useAuthHydrated";
import { useAuthStore } from "@/lib/auth-store";
import { useSettingsStore } from "@/lib/settings-store";

const DOCK = [
  { href: "/", labelKey: "nav.feed", icon: "◈" },
  { href: "/twin", labelKey: "nav.twin", icon: "◎" },
  { href: "/studio", labelKey: "nav.studio", icon: "▣" },
  { href: "/live", labelKey: "nav.live", icon: "●" },
  { href: "/status", labelKey: "nav.status", icon: "◌" },
  { href: "/calls", labelKey: "nav.calls", icon: "☎" },
  { href: "/teams", labelKey: "nav.teams", icon: "▤" },
  { href: "/contacts", labelKey: "nav.contacts", icon: "☰" },
  { href: "/hub", labelKey: "nav.hub", icon: "◉" },
  { href: "/marketplace", labelKey: "nav.market", icon: "🛒" },
  { href: "/map", labelKey: "nav.map", icon: "⌖" },
  { href: "/find", labelKey: "nav.find", icon: "⊕" },
  { href: "/connections", labelKey: "nav.connect", icon: "◇" },
  { href: "/inbox", labelKey: "nav.inbox", icon: "✉" },
  { href: "/settings", labelKey: "nav.settings", icon: "⚙" },
] as const;

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
          ? "border-b border-[#1F1F1F]/80 bg-[#0A0A0A]/90 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-[#00E5FF]/30 bg-[#00E5FF]/10">
            <span className="text-[10px] font-bold text-[#00E5FF]">NS</span>
          </div>
          <span
            className={`text-sm font-semibold tracking-[0.15em] uppercase text-[#F5F5F5] transition-opacity duration-500 ${
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
            {DOCK.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={t(item.labelKey)}
                className={`px-2 py-1.5 text-[10px] uppercase tracking-wider rounded-md transition-colors ${
                  pathname === item.href
                    ? "text-[#00E5FF] bg-[#00E5FF]/10"
                    : "text-[#6A6A6A] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]/60"
                }`}
              >
                <span className="hidden sm:inline">{item.icon} </span>
                <span className="hidden md:inline">{t(item.labelKey)}</span>
                <span className="sm:hidden">{item.icon}</span>
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {voiceOn && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#00E5FF]" title={t("nav.voiceActive")} />
          )}
          {hydrated && !session && (
            <>
              <Link href="/login" className="text-[10px] text-[#8A8A8A] hover:text-[#F5F5F5]">
                {t("nav.signIn")}
              </Link>
              <Link
                href="/register"
                className="text-[10px] px-2 py-1 rounded border border-[#00E5FF]/30 text-[#00E5FF]"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
          {hydrated && session && (
            <>
              <div className="hidden sm:flex rounded-md border border-[#2A2A2A] p-0.5">
                {(["personal", "professional"] as const).map((ctx) => (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => setViewContext(ctx)}
                    className={`px-2 py-0.5 text-[9px] uppercase tracking-wider rounded ${
                      viewContext === ctx ? "bg-[#00E5FF]/20 text-[#00E5FF]" : "text-[#5A5A5A]"
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
                className="text-[10px] text-[#5A5A5A] hover:text-[#F5F5F5]"
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