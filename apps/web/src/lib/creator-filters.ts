/** TikTok-style creator filters — shared by Studio, Feed, and sector rules */

export interface CreatorFilter {
  id: string;
  label: string;
  css: string;
  category: "original" | "color" | "mood" | "beauty" | "brand";
}

export const CREATOR_FILTERS: CreatorFilter[] = [
  { id: "none", label: "Original", css: "none", category: "original" },
  { id: "nexsocio", label: "Nex Glow", css: "saturate(1.25) contrast(1.08) hue-rotate(-12deg) brightness(0.98)", category: "brand" },
  { id: "cyber", label: "Cyber", css: "saturate(1.4) contrast(1.1) hue-rotate(180deg)", category: "color" },
  { id: "warm", label: "Warm", css: "sepia(0.35) saturate(1.2)", category: "color" },
  { id: "cool", label: "Cool", css: "hue-rotate(200deg) saturate(1.15) brightness(1.05)", category: "color" },
  { id: "mono", label: "Mono", css: "grayscale(1) contrast(1.15)", category: "mood" },
  { id: "neon", label: "Neon", css: "saturate(2) contrast(1.3) brightness(1.1)", category: "color" },
  { id: "vintage", label: "Vintage", css: "sepia(0.6) contrast(0.9)", category: "mood" },
  { id: "golden", label: "Golden Hour", css: "sepia(0.25) saturate(1.35) brightness(1.08)", category: "mood" },
  { id: "dream", label: "Dream", css: "saturate(0.85) brightness(1.12) contrast(0.92) hue-rotate(-8deg)", category: "beauty" },
  { id: "glow", label: "Soft Glow", css: "brightness(1.08) contrast(0.95) saturate(1.1)", category: "beauty" },
  { id: "pop", label: "Pop", css: "saturate(1.6) contrast(1.2) brightness(1.05)", category: "color" },
  { id: "fade", label: "Fade", css: "saturate(0.7) brightness(1.15) contrast(0.88)", category: "mood" },
  { id: "noir", label: "Noir", css: "grayscale(0.9) contrast(1.35) brightness(0.9)", category: "mood" },
  { id: "sunset", label: "Sunset", css: "sepia(0.4) hue-rotate(-18deg) saturate(1.4)", category: "mood" },
  { id: "ocean", label: "Ocean", css: "hue-rotate(165deg) saturate(1.2) brightness(1.02)", category: "color" },
  { id: "candy", label: "Candy", css: "saturate(1.8) hue-rotate(320deg) brightness(1.06)", category: "color" },
  { id: "clean", label: "Clean Skin", css: "brightness(1.06) contrast(0.96) saturate(0.95)", category: "beauty" },
];

export const FILTER_CSS: Record<string, string> = Object.fromEntries(
  CREATOR_FILTERS.map((f) => [f.id, f.css])
);

export function getFilterCss(id: string | null | undefined): string | undefined {
  if (!id || id === "none") return undefined;
  return FILTER_CSS[id];
}

export function getFilterById(id: string): CreatorFilter | undefined {
  return CREATOR_FILTERS.find((f) => f.id === id);
}