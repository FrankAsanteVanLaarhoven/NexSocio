"use client";

import { Panel } from "@nexus/ui";
import { SettingToggle } from "@/components/settings/SettingsSectionShell";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";
import { useSettingsStore } from "@/lib/settings-store";

export default function MediaSettingsPage() {
  const s = useSettingsStore();

  return (
    <SettingsSectionShell section="media">
      <Panel open title="Offline video & downloads">
        <SettingToggle label="Allow offline downloads" on={s.offlineDownloads} onChange={(v) => s.update({ offlineDownloads: v })} />
        <SettingToggle label="WiFi only downloads" on={s.wifiOnlyDownloads} onChange={(v) => s.update({ wifiOnlyDownloads: v })} />
      </Panel>
      <Panel open title="Downloads library">
        <p className="text-xs text-[#5A5A5A]">No offline videos saved</p>
      </Panel>
      <Panel open title="Podcast & vlog">
        <p className="text-xs text-[#8A8A8A]">Manage podcast feeds and vlog series from Studio.</p>
      </Panel>
    </SettingsSectionShell>
  );
}