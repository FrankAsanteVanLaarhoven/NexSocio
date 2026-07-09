"use client";

import { useEffect, useState } from "react";
import { useAuthHydrated } from "@/hooks/useAuthHydrated";
import { getFeatureFlags } from "@/lib/api";
import { useTranslation } from "@/i18n";
import { useAuthStore } from "@/lib/auth-store";

export function BetaBanner() {
  const { t } = useTranslation();
  const hydrated = useAuthHydrated();
  const session = useAuthStore((s) => s.session);
  const [cohort, setCohort] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    getFeatureFlags(session.accessToken)
      .then((f) => {
        if (!cancelled) setCohort(f.cohort ?? null);
      })
      .catch(() => {
        if (!cancelled) setCohort(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!hydrated || !session || !cohort) return null;

  return (
    <div className="border-b border-[#00E5FF]/20 bg-[#00E5FF]/5 px-6 py-1.5 text-center">
      <p className="text-[10px] uppercase tracking-widest text-[#00E5FF]">
        {t("common.betaBanner")} {cohort}
      </p>
    </div>
  );
}