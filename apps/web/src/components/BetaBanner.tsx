"use client";

import { useEffect, useState } from "react";
import { getFeatureFlags } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function BetaBanner() {
  const session = useAuthStore((s) => s.session);
  const [cohort, setCohort] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    getFeatureFlags(session.accessToken).then((f) => setCohort(f.cohort ?? null));
  }, [session]);

  if (!session || !cohort) return null;

  return (
    <div className="border-b border-[#00E5FF]/20 bg-[#00E5FF]/5 px-6 py-1.5 text-center">
      <p className="text-[10px] uppercase tracking-widest text-[#00E5FF]">
        Public Beta · Cohort: {cohort}
      </p>
    </div>
  );
}