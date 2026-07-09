export type ThemeMode = "dark" | "light" | "system";

export type ResolvedTheme = "dark" | "light";

export const DEFAULT_ACCENT = "#00E5FF";

/** Curated professional accent presets (rainbow spectrum) */
export const ACCENT_PRESETS = [
  { id: "cyan", label: "Cyan", hex: "#00E5FF" },
  { id: "blue", label: "Blue", hex: "#4FC3F7" },
  { id: "indigo", label: "Indigo", hex: "#7C4DFF" },
  { id: "violet", label: "Violet", hex: "#B388FF" },
  { id: "magenta", label: "Magenta", hex: "#E040FB" },
  { id: "rose", label: "Rose", hex: "#FF5252" },
  { id: "orange", label: "Orange", hex: "#FF9100" },
  { id: "amber", label: "Amber", hex: "#FFB300" },
  { id: "lime", label: "Lime", hex: "#C6FF00" },
  { id: "green", label: "Green", hex: "#00C853" },
  { id: "teal", label: "Teal", hex: "#00BFA5" },
  { id: "slate", label: "Slate", hex: "#90A4AE" },
] as const;

export type AccentPresetId = (typeof ACCENT_PRESETS)[number]["id"] | "custom";

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
}

export function normalizeHex(hex: string): string {
  const parsed = parseHex(hex);
  if (!parsed) return DEFAULT_ACCENT;
  const { r, g, b } = parsed;
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
}

function mix(a: number, b: number, t: number) {
  return clamp(a + (b - a) * t);
}

export function lighten(hex: string, amount = 0.12): string {
  const c = parseHex(hex);
  if (!c) return hex;
  return `#${mix(c.r, 255, amount).toString(16).padStart(2, "0")}${mix(c.g, 255, amount).toString(16).padStart(2, "0")}${mix(c.b, 255, amount).toString(16).padStart(2, "0")}`;
}

export function accentCssVars(accent: string): Record<string, string> {
  const hex = normalizeHex(accent);
  const rgb = parseHex(hex);
  if (!rgb) return { "--color-accent": DEFAULT_ACCENT };
  const { r, g, b } = rgb;
  const hover = lighten(hex, 0.14);
  return {
    "--color-accent": hex,
    "--color-accent-rgb": `${r} ${g} ${b}`,
    "--color-accent-hover": hover,
    "--color-accent-muted": `rgba(${r}, ${g}, ${b}, 0.1)`,
    "--color-accent-subtle": `rgba(${r}, ${g}, ${b}, 0.05)`,
    "--color-accent-border": `rgba(${r}, ${g}, ${b}, 0.3)`,
    "--color-accent-glow": `rgba(${r}, ${g}, ${b}, 0.2)`,
    "--color-accent-grid": `rgba(${r}, ${g}, ${b}, 0.03)`,
  };
}

export function resolveThemeMode(mode: ThemeMode): ResolvedTheme {
  if (mode === "system" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  if (mode === "light") return "light";
  return "dark";
}

export function presetFromAccent(hex: string): AccentPresetId {
  const norm = normalizeHex(hex);
  const match = ACCENT_PRESETS.find((p) => p.hex.toUpperCase() === norm);
  return match?.id ?? "custom";
}