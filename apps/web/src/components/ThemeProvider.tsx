"use client";

import { useEffect } from "react";
import {
  accentCssVars,
  normalizeHex,
  resolveThemeMode,
  type ThemeMode,
} from "@/lib/theme";
import { useSettingsStore } from "@/lib/settings-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const accentColor = useSettingsStore((s) => s.accentColor);

  useEffect(() => {
    const root = document.documentElement;

    function apply(mode: ThemeMode, accent: string) {
      const resolved = resolveThemeMode(mode);
      root.setAttribute("data-theme", resolved);
      root.style.colorScheme = resolved;

      const vars = accentCssVars(accent);
      for (const [key, val] of Object.entries(vars)) {
        root.style.setProperty(key, val);
      }

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", normalizeHex(accent));
    }

    apply(themeMode, accentColor);

    if (themeMode !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => apply("system", accentColor);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [themeMode, accentColor]);

  return <>{children}</>;
}