/**
 * NexSocio canonical brand — liquid N mark (locked).
 * All UI, PWA, favicon, and push assets must reference these paths.
 * Regenerate icons: npm run pwa:icons (from public/brand/logo-mark-source.jpg)
 */
export const BRAND_LOGO_ID = "nexsocio-liquid-n" as const;
export const BRAND_LOGO_VERSION = 1 as const;

export const BRAND_DISPLAY_NAME = "NexSocio" as const;
export const BRAND_WORDMARK = {
  primary: "Nex",
  accent: "Socio",
} as const;

/** Canonical logo assets (do not swap without bumping BRAND_LOGO_VERSION) */
export const BRAND_LOGO = {
  id: BRAND_LOGO_ID,
  version: BRAND_LOGO_VERSION,
  source: "/brand/logo-mark-source.jpg",
  mark: "/brand/logo-mark.png",
  markAccent: "/brand/logo-mark-accent.png",
  markAccentDark: "/brand/logo-mark-accent-dark.png",
  splashVideo: "/splash-nexsocio.mp4",
} as const;

export const BRAND_ICONS = {
  favicon: "/icons/favicon.png",
  icon192: "/icons/icon-192.png",
  icon512: "/icons/icon-512.png",
  apple: "/icons/icon-192.png",
} as const;

/** Default accent-aligned palette (splash + fallbacks; UI uses CSS vars when themed) */
export const BRAND_COLORS = {
  accent: "#00E5FF",
  accentRgb: "0 229 255",
  navy: "#0A1628",
  base: "#0A0A0A",
} as const;

export type BrandLogoVariant = "header" | "icon" | "wordmark";
export type BrandLogoSize = "md" | "lg";