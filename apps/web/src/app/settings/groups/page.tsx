"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useState } from "react";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";

export default function GroupsSettingsPage() {
  const [name, setName] = useState("");

  return (
    <SettingsSectionShell section="groups">
      <Panel open title="Your groups">
        {["NexSocio Creators", "London Tech", "Digital Twin Builders"].map((g) => (
          <div key={g} className="flex justify-between py-2 border-b border-[#1F1F1F] text-sm text-[#F5F5F5]">
            {g}
            <span className="text-[10px] text-[#5A5A5A]">24 members</span>
          </div>
        ))}
      </Panel>
      <Panel open title="Create group">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" />
        <Button size="sm" className="w-full mt-2">Create</Button>
      </Panel>
    </SettingsSectionShell>
  );
}