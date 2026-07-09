"use client";

import { useTranslation } from "@/i18n";
import {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  normalizeHex,
  presetFromAccent,
  type AccentPresetId,
  type ThemeMode,
} from "@/lib/theme";
import { useSettingsStore } from "@/lib/settings-store";

const MODES: ThemeMode[] = ["dark", "light", "system"];

export function ThemeSettings() {
  const { t } = useTranslation();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const accentColor = useSettingsStore((s) => s.accentColor);
  const accentPreset = useSettingsStore((s) => s.accentPreset);
  const update = useSettingsStore((s) => s.update);

  const activePreset = accentPreset === "custom" ? "custom" : presetFromAccent(accentColor);

  function selectPreset(id: AccentPresetId, hex: string) {
    update({ accentPreset: id, accentColor: hex });
  }

  function selectCustom(hex: string) {
    update({ accentPreset: "custom", accentColor: normalizeHex(hex) });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-muted uppercase tracking-wider">{t("settings.themeMode")}</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => update({ themeMode: mode })}
              className={`rounded-lg border px-3 py-2.5 text-xs capitalize transition-colors ${
                themeMode === mode
                  ? "border-accent bg-accent-muted text-accent"
                  : "border-default text-muted hover:text-primary hover:border-[var(--color-border-hover)]"
              }`}
            >
              {t(`settings.theme.${mode}`)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-dim">{t("settings.themeHint")}</p>
      </div>

      <div>
        <label className="text-xs text-muted uppercase tracking-wider">{t("settings.accentColor")}</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              aria-label={preset.label}
              onClick={() => selectPreset(preset.id, preset.hex)}
              className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 ${
                activePreset === preset.id ? "border-primary ring-2 ring-accent scale-105" : "border-transparent"
              }`}
              style={{ backgroundColor: preset.hex }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-default bg-surface-elevated p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-primary">{t("settings.customAccent")}</p>
            <p className="text-[10px] text-dim mt-0.5">{t("settings.customAccentHint")}</p>
          </div>
          <div
            className="h-10 w-10 shrink-0 rounded-lg border border-accent"
            style={{ backgroundColor: accentColor }}
            aria-hidden
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={normalizeHex(accentColor)}
            onChange={(e) => selectCustom(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded border border-default bg-transparent p-0.5"
            aria-label={t("settings.customAccent")}
          />
          <input
            type="text"
            value={accentColor}
            onChange={(e) => selectCustom(e.target.value)}
            placeholder={DEFAULT_ACCENT}
            className="flex-1 rounded-md border border-default bg-base px-3 py-2 text-sm text-primary font-mono uppercase tracking-wide"
            maxLength={7}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <span className="inline-flex items-center rounded-md border border-accent bg-accent-muted px-2.5 py-1 text-[10px] text-accent">
            {t("settings.accentPreview")}
          </span>
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-accent px-2.5 py-1 text-[10px] font-medium text-on-accent"
          >
            {t("settings.accentButton")}
          </button>
        </div>
      </div>
    </div>
  );
}