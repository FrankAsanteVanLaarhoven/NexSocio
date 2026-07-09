"use client";

import { Input, Panel } from "@nexus/ui";
import { SecuritySetup } from "@/components/auth/SecuritySetup";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { SettingToggle } from "@/components/settings/SettingsSectionShell";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";
import { LOCALE_CODES, LOCALES, normalizeLocale } from "@/i18n";
import { useTranslation } from "@/i18n";
import { useSettingsStore } from "@/lib/settings-store";

const CURRENCIES = ["GBP", "USD", "EUR", "JPY", "NGN", "GHS"];

export default function AccountSettingsPage() {
  const s = useSettingsStore();
  const { t } = useTranslation();
  const locale = normalizeLocale(s.locale);

  return (
    <SettingsSectionShell section="account">
      <div id="prefs" />
      <Panel open title={t("settings.appearance")}>
        <ThemeSettings />
      </Panel>
      <Panel open title={t("settings.localization")}>
        <div className="space-y-3">
          <label className="text-xs text-muted uppercase">{t("settings.language")}</label>
          <select
            value={locale}
            onChange={(e) => s.update({ locale: e.target.value })}
            className="w-full rounded-md border border-default bg-base px-3 py-2 text-sm text-primary"
          >
            {LOCALE_CODES.map((code) => (
              <option key={code} value={code}>
                {LOCALES[code].nativeName} ({LOCALES[code].label})
              </option>
            ))}
          </select>
          <Input label={t("settings.timezone")} value={s.timezone} onChange={(e) => s.update({ timezone: e.target.value })} />
          <select
            value={s.currency}
            onChange={(e) => s.update({ currency: e.target.value })}
            className="w-full rounded-md border border-default bg-base px-3 py-2 text-sm text-primary"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </Panel>
      <Panel open title={t("settings.voiceUi")}>
        <div className="space-y-2">
          <SettingToggle label={t("settings.voiceCommands")} hint={t("settings.voiceHint")} on={s.voiceControlEnabled} onChange={(v) => s.update({ voiceControlEnabled: v })} />
          <SettingToggle label={t("settings.ephemeralNav")} on={s.ephemeralNav} onChange={(v) => s.update({ ephemeralNav: v })} />
          <SettingToggle label={t("settings.notifications")} on={s.notificationsEnabled} onChange={(v) => s.update({ notificationsEnabled: v })} />
          <SettingToggle label={t("settings.commentModeration")} on={s.commentModeration} onChange={(v) => s.update({ commentModeration: v })} />
        </div>
      </Panel>
      <div id="ai" />
      <Panel open title={t("settings.aiTitle")}>
        <p className="text-xs text-muted leading-relaxed">
          {t("settings.aiBody")}
        </p>
      </Panel>
      <SecuritySetup />
    </SettingsSectionShell>
  );
}