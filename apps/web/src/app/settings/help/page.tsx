"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useState } from "react";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";

export default function HelpSettingsPage() {
  const [msg, setMsg] = useState("");

  return (
    <SettingsSectionShell section="help">
      <Panel open title="Help centre">
        <div className="space-y-2 text-xs">
          {["Getting started", "Digital twin guide", "Wallet & payouts", "Report a problem"].map((t) => (
            <button key={t} type="button" className="block w-full text-left py-2 text-[#8A8A8A] hover:text-[#00E5FF]">{t}</button>
          ))}
        </div>
      </Panel>
      <Panel open title="Send feedback">
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={4}
          placeholder="Tell us what you think…"
          className="w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
        />
        <Button size="sm" className="w-full mt-2">Submit</Button>
      </Panel>
    </SettingsSectionShell>
  );
}