"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useState } from "react";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";

export default function JobsSettingsPage() {
  const [role, setRole] = useState("");

  return (
    <SettingsSectionShell section="jobs">
      <Panel open title="Jobs & available roles">
        <div className="space-y-2">
          {["Senior Product Designer — Remote", "Full-stack Engineer — London", "Marketing Lead — Hybrid"].map((j) => (
            <div key={j} className="rounded-lg border border-[#1F1F1F] px-3 py-2 text-xs text-[#D4D4D4]">{j}</div>
          ))}
        </div>
      </Panel>
      <Panel open title="Hiring">
        <Input label="Open role title" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Community Manager" />
        <Button className="w-full mt-2" size="sm">Post job</Button>
      </Panel>
      <Panel open title="Marketing">
        <p className="text-xs text-[#8A8A8A]">Email campaigns, audience segments, and promoted posts for your business profile.</p>
        <Button className="w-full mt-3" size="sm" variant="secondary">Create campaign</Button>
      </Panel>
    </SettingsSectionShell>
  );
}