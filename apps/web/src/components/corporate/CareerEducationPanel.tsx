"use client";

import type { CorporateSector } from "@nexus/types";
import { Button, Panel } from "@nexus/ui";
import { useTranslation } from "@/i18n";

const STUB_PROGRAMMES = [
  {
    id: "apprenticeships",
    sector: "education",
    titleKey: "career.programmeApprenticeships",
    descKey: "career.programmeApprenticeshipsDesc",
  },
  {
    id: "professional-certs",
    sector: "education",
    titleKey: "career.programmeCerts",
    descKey: "career.programmeCertsDesc",
  },
  {
    id: "graduate-schemes",
    sector: "general",
    titleKey: "career.programmeGraduate",
    descKey: "career.programmeGraduateDesc",
  },
  {
    id: "wellbeing",
    sector: "health",
    titleKey: "career.programmeWellbeing",
    descKey: "career.programmeWellbeingDesc",
  },
] as const;

export function CareerEducationPanel({
  sectors,
  onViewJobs,
}: {
  sectors: CorporateSector[];
  onViewJobs?: (sector?: string) => void;
}) {
  const { t } = useTranslation();

  function sectorLabel(id: string) {
    return sectors.find((s) => s.id === id)?.label ?? id;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#4FC3F7]/20 bg-[#4FC3F7]/5 p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#4FC3F7]">{t("career.educationTitle")}</p>
        <p className="mt-1 text-xs text-[#8A8A8A]">{t("career.educationHint")}</p>
      </div>

      <Panel open title={t("career.educationProgrammes")}>
        <ul className="space-y-3">
          {STUB_PROGRAMMES.map((programme) => (
            <li key={programme.id} className="rounded-lg border border-[#1F1F1F] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#F5F5F5]">{t(programme.titleKey)}</p>
                  <p className="mt-1 text-xs text-[#8A8A8A]">{t(programme.descKey)}</p>
                  <span className="mt-2 inline-block rounded bg-[#4FC3F7]/10 px-1.5 py-0.5 text-[10px] text-[#4FC3F7]">
                    {sectorLabel(programme.sector)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onViewJobs?.(programme.sector)}
                >
                  {t("career.viewRelatedJobs")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[10px] text-[#5A5A5A]">{t("career.educationStubNote")}</p>
      </Panel>
    </div>
  );
}