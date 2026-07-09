"use client";

import { Panel } from "@nexus/ui";
import { SecuritySetup } from "@/components/auth/SecuritySetup";
import { SettingRow } from "@/components/settings/SettingsSectionShell";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";

export default function SecuritySettingsPage() {
  return (
    <SettingsSectionShell section="security">
      <SecuritySetup />
      <Panel open title="Active sessions">
        <SettingRow label="This device" hint="London · Chrome · now" />
        <SettingRow label="Mobile" hint="Last active 2h ago · Revoke" />
      </Panel>
      <Panel open title="Sign-in alerts">
        <p className="text-xs text-[#8A8A8A]">Email alerts for new sign-ins from unknown devices.</p>
      </Panel>
    </SettingsSectionShell>
  );
}