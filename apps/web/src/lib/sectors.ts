import type { PostSector } from "@nexus/types";

export type { PostSector };

export const POST_SECTORS: PostSector[] = [
  "personal",
  "business_general",
  "business_corporate",
];

export function normalizeSector(value: string | undefined | null): PostSector {
  if (value === "professional" || value === "business_general") return "business_general";
  if (value === "business_corporate") return "business_corporate";
  return "personal";
}

export const SECTOR_META: Record<
  PostSector,
  { short: string; labelKey: string; descKey: string; tone: "accent" | "pro" | "corp" }
> = {
  personal: {
    short: "Pers",
    labelKey: "sector.personal",
    descKey: "sector.personalDesc",
    tone: "accent",
  },
  business_general: {
    short: "Biz",
    labelKey: "sector.businessGeneral",
    descKey: "sector.businessGeneralDesc",
    tone: "pro",
  },
  business_corporate: {
    short: "Corp",
    labelKey: "sector.businessCorporate",
    descKey: "sector.businessCorporateDesc",
    tone: "corp",
  },
};

export const PERSONAL_FILTERS = new Set(["none", "cyber", "warm", "mono", "neon", "vintage"]);
export const BUSINESS_GENERAL_FILTERS = new Set(["none", "warm", "mono", "cyber"]);
export const CORPORATE_FILTERS = new Set(["none", "mono"]);

export function allowedFilters(sector: PostSector): Set<string> {
  if (sector === "personal") return PERSONAL_FILTERS;
  if (sector === "business_general") return BUSINESS_GENERAL_FILTERS;
  return CORPORATE_FILTERS;
}

export const STUDIO_MODES_PERSONAL = ["reel", "photo", "ai_video", "podcast", "vlog", "tv"] as const;
export const STUDIO_MODES_BUSINESS_GENERAL = ["reel", "photo", "podcast", "vlog", "tv"] as const;
export const STUDIO_MODES_CORPORATE = ["photo", "podcast", "vlog", "tv"] as const;

export function studioModesFor(sector: PostSector): readonly string[] {
  if (sector === "personal") return STUDIO_MODES_PERSONAL;
  if (sector === "business_general") return STUDIO_MODES_BUSINESS_GENERAL;
  return STUDIO_MODES_CORPORATE;
}

export const FILTER_CSS: Record<string, string> = {
  cyber: "saturate(1.4) contrast(1.1) hue-rotate(180deg)",
  warm: "sepia(0.35) saturate(1.2)",
  mono: "grayscale(1) contrast(1.15)",
  neon: "saturate(2) contrast(1.3) brightness(1.1)",
  vintage: "sepia(0.6) contrast(0.9)",
};

export function sectorBadgeClass(sector: PostSector): string {
  if (sector === "business_corporate") return "text-[#4FC3F7]";
  if (sector === "business_general") return "text-[#FFB300]";
  return "text-accent";
}

export function feedTypeForSector(
  sector: PostSector,
  personalFeedType: "global" | "connections"
): "global" | "connections" | "business_general" | "business_corporate" {
  if (sector === "personal") return personalFeedType;
  if (sector === "business_corporate") return "business_corporate";
  return "business_general";
}