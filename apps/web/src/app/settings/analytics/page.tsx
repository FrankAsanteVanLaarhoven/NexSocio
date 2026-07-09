"use client";

import { Panel } from "@nexus/ui";
import { StatCard } from "@/components/settings/SettingsSectionShell";
import { SettingToggle } from "@/components/settings/SettingsSectionShell";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";
import { useSettingsStore } from "@/lib/settings-store";

const VIEWERS = [
  { name: "Alex M.", time: "2m ago", context: "professional" },
  { name: "Jordan K.", time: "1h ago", context: "personal" },
  { name: "Sam T.", time: "3h ago", context: "professional" },
];

export default function AnalyticsSettingsPage() {
  const s = useSettingsStore();

  return (
    <SettingsSectionShell section="analytics">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Post impressions" value="12.4k" trend="+8% this week" />
        <StatCard label="Profile views" value="386" trend="+22 today" />
      </div>
      <Panel open title="Who viewed">
        <SettingToggle
          label="Show who viewed your profile"
          on={s.showProfileViewers}
          onChange={(v) => s.update({ showProfileViewers: v })}
        />
        <div className="mt-3 space-y-2">
          {VIEWERS.map((v) => (
            <div key={v.name} className="flex justify-between text-xs py-2 border-b border-[#1F1F1F]">
              <span className="text-[#F5F5F5]">{v.name}</span>
              <span className="text-[#5A5A5A]">{v.time} · {v.context}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel open title="Post impressions">
        <p className="text-xs text-[#8A8A8A]">Top post: Twin update — 2.1k impressions · 340 engagements</p>
      </Panel>
      <Panel open title="Sales">
        <StatCard label="Revenue (30d)" value="£2,840" trend="Professional" />
      </Panel>
    </SettingsSectionShell>
  );
}