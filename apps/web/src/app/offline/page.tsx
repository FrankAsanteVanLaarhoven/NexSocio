"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { useTranslation } from "@/i18n";

export default function OfflinePage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-6 text-center text-primary">
      <BrandLogo href={undefined} variant="icon" size="lg" className="mb-6 scale-150" />
      <h1 className="text-xl font-semibold">{t("offline.title")}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">{t("offline.body")}</p>
      <Link href="/" className="mt-6 text-sm text-accent hover:underline">
        {t("offline.tryAgain")}
      </Link>
    </div>
  );
}