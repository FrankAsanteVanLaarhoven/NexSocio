"use client";

import { Panel } from "@nexus/ui";
import { SettingToggle } from "@/components/settings/SettingsSectionShell";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";

export default function ConnectivitySettingsPage() {
  return (
    <SettingsSectionShell section="connectivity">
      <Panel open title="WiFi">
        <SettingToggle label="Prefer WiFi for media" hint="Save mobile data" on={true} onChange={() => {}} />
      </Panel>
      <Panel open title="Airdrop & nearby share">
        <p className="text-xs text-[#8A8A8A]">Share posts, contacts, and files with nearby NexSocio users.</p>
        <SettingToggle label="Discoverable nearby" on={false} onChange={() => {}} />
      </Panel>
      <Panel open title="Remote access">
        <p className="text-xs text-[#8A8A8A]">Approve trusted devices for twin control and remote sessions.</p>
      </Panel>
    </SettingsSectionShell>
  );
}