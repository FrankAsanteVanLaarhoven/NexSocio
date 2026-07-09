"use client";

import { Input, Panel } from "@nexus/ui";
import { SecuritySetup } from "@/components/auth/SecuritySetup";
import { SettingToggle } from "@/components/settings/SettingsSectionShell";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";
import { useSettingsStore } from "@/lib/settings-store";

const LOCALES = [
  { id: "en-GB", label: "English (UK)" },
  { id: "en-US", label: "English (US)" },
  { id: "fr-FR", label: "Français" },
  { id: "de-DE", label: "Deutsch" },
];

const CURRENCIES = ["GBP", "USD", "EUR", "JPY", "NGN", "GHS"];

export default function AccountSettingsPage() {
  const s = useSettingsStore();

  return (
    <SettingsSectionShell section="account">
      <div id="prefs" />
      <Panel open title="Localization">
        <div className="space-y-3">
          <label className="text-xs text-[#8A8A8A] uppercase">Language</label>
          <select
            value={s.locale}
            onChange={(e) => s.update({ locale: e.target.value })}
            className="w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
          >
            {LOCALES.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
          <Input label="Timezone" value={s.timezone} onChange={(e) => s.update({ timezone: e.target.value })} />
          <select
            value={s.currency}
            onChange={(e) => s.update({ currency: e.target.value })}
            className="w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </Panel>
      <Panel open title="Voice & UI">
        <div className="space-y-2">
          <SettingToggle label="Voice commands" hint="Control NEXSOCIO by voice" on={s.voiceControlEnabled} onChange={(v) => s.update({ voiceControlEnabled: v })} />
          <SettingToggle label="Ephemeral navigation" on={s.ephemeralNav} onChange={(v) => s.update({ ephemeralNav: v })} />
          <SettingToggle label="Notifications" on={s.notificationsEnabled} onChange={(v) => s.update({ notificationsEnabled: v })} />
          <SettingToggle label="Comment moderation" on={s.commentModeration} onChange={(v) => s.update({ commentModeration: v })} />
        </div>
      </Panel>
      <div id="ai" />
      <Panel open title="NEXSOCIO AI">
        <p className="text-xs text-[#8A8A8A] leading-relaxed">
          AI posts show a NEXSOCIO AI badge. Premium/Business can hide it for ads.
        </p>
      </Panel>
      <SecuritySetup />
    </SettingsSectionShell>
  );
}