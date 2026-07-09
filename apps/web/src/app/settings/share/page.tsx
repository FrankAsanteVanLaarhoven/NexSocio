"use client";

import { Panel } from "@nexus/ui";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";

export default function ShareSettingsPage() {
  const inviteLink = "https://nexsocio.app/invite/favl";

  return (
    <SettingsSectionShell section="share">
      <Panel open title="Invite friends">
        <p className="text-xs text-[#8A8A8A] mb-2">Share your link — earn bonus coins when friends join.</p>
        <div className="rounded-md border border-[#2A2A2A] px-3 py-2 text-xs text-[#00E5FF] break-all">{inviteLink}</div>
        <button type="button" className="mt-2 text-xs text-[#F5F5F5] hover:text-[#00E5FF]">Copy link</button>
      </Panel>
      <Panel open title="QR invite">
        <div className="mx-auto h-32 w-32 rounded-lg border border-dashed border-[#2A2A2A] flex items-center justify-center text-[#5A5A5A] text-xs">
          QR Code
        </div>
      </Panel>
    </SettingsSectionShell>
  );
}