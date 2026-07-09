"use client";

import { Panel } from "@nexus/ui";
import { ConnectorButton } from "@/components/settings/SettingsSectionShell";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";
import { useSettingsStore } from "@/lib/settings-store";

const CONNECTORS = [
  { id: "slack", name: "Slack", hash: "slack" },
  { id: "github", name: "GitHub", hash: "github" },
  { id: "linkedin", name: "LinkedIn", hash: "linkedin" },
  { id: "email", name: "Email (Gmail / Outlook)", hash: "email" },
  { id: "twitter", name: "X / Twitter", hash: "social" },
  { id: "instagram", name: "Instagram", hash: "social" },
  { id: "tiktok", name: "TikTok", hash: "social" },
  { id: "youtube", name: "YouTube", hash: "social" },
];

export default function NetworkSettingsPage() {
  const { connectors, toggleConnector } = useSettingsStore();

  return (
    <SettingsSectionShell section="network">
      <Panel open title="Connectors" subtitle="Link tools — stay productive">
        <div className="space-y-2">
          {CONNECTORS.map((c) => (
            <div key={c.id} id={c.hash === c.id ? c.hash : undefined}>
              <ConnectorButton
                name={c.name}
                connected={!!connectors[c.id]}
                onConnect={() => toggleConnector(c.id)}
              />
            </div>
          ))}
        </div>
      </Panel>
      <Panel open title="Followers & following">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-lg border border-[#1F1F1F] p-4">
            <p className="text-2xl text-[#00E5FF]">128</p>
            <p className="text-[10px] text-[#5A5A5A]">Followers</p>
          </div>
          <div className="rounded-lg border border-[#1F1F1F] p-4">
            <p className="text-2xl text-[#7C4DFF]">94</p>
            <p className="text-[10px] text-[#5A5A5A]">Following</p>
          </div>
        </div>
      </Panel>
    </SettingsSectionShell>
  );
}