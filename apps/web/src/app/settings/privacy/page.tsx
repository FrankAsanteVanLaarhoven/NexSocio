"use client";

import { Panel } from "@nexus/ui";
import { SettingToggle } from "@/components/settings/SettingsSectionShell";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";
import { useSettingsStore } from "@/lib/settings-store";

export default function PrivacySettingsPage() {
  const s = useSettingsStore();

  return (
    <SettingsSectionShell section="privacy">
      <Panel open title="Data privacy">
        <div className="space-y-2 text-xs text-[#8A8A8A]">
          <button type="button" className="block w-full text-left py-2 hover:text-[#00E5FF]">Download my data</button>
          <button type="button" className="block w-full text-left py-2 hover:text-[#FF5252]">Delete account data</button>
        </div>
      </Panel>
      <Panel open title="Visibility">
        <div className="space-y-2">
          {(["public", "connections", "private"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => s.update({ profileVisibility: v })}
              className={`w-full text-left px-3 py-2 rounded-md border text-sm capitalize ${
                s.profileVisibility === v ? "border-[#00E5FF] text-[#00E5FF]" : "border-[#2A2A2A] text-[#8A8A8A]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </Panel>
      <Panel open title="Advertising data">
        <SettingToggle
          label="Personalised ads"
          hint="Use activity to improve ad relevance"
          on={s.personalizedAds}
          onChange={(v) => s.update({ personalizedAds: v })}
        />
        <SettingToggle
          label="Share analytics with partners"
          on={s.shareAnalytics}
          onChange={(v) => s.update({ shareAnalytics: v })}
        />
      </Panel>
    </SettingsSectionShell>
  );
}