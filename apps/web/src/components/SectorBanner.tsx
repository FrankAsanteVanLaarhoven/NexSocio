"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n";
import { useAuthHydrated } from "@/hooks/useAuthHydrated";
import { useAuthStore } from "@/lib/auth-store";
import { normalizeSector, SECTOR_META } from "@/lib/sectors";

export function SectorBanner() {
  const { t } = useTranslation();
  const hydrated = useAuthHydrated();
  const session = useAuthStore((s) => s.session);

  if (!hydrated || !session) return null;

  const sector = normalizeSector(session.viewContext);
  const meta = SECTOR_META[sector];

  return (
    <div
      className={`border-b px-5 py-2 text-center text-[11px] sm:px-8 lg:px-10 ${
        sector === "business_corporate"
          ? "border-[#4FC3F7]/25 bg-[#4FC3F7]/5 text-[#4FC3F7]"
          : sector === "business_general"
            ? "border-[#FFB300]/25 bg-[#FFB300]/5 text-[#FFB300]"
            : "border-accent/20 bg-accent/5 text-accent"
      }`}
    >
      <span className="font-medium uppercase tracking-wider">{t("sector.postingAs")}</span>{" "}
      <span className="text-primary">{t(meta.labelKey)}</span>
      <span className="mx-2 text-dim">·</span>
      <span className="text-dim">{t(meta.descKey)}</span>
      {sector === "business_corporate" && (
        <>
          <span className="mx-2 text-dim">·</span>
          <Link href="/corporate" className="underline-offset-2 hover:underline">
            {t("sector.corporateHub")}
          </Link>
        </>
      )}
    </div>
  );
}