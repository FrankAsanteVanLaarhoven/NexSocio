"use client";

import { Panel } from "@nexus/ui";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";

export default function LegalSettingsPage() {
  return (
    <SettingsSectionShell section="legal">
      <Panel open title="Terms of service">
        <p className="text-xs text-[#8A8A8A] leading-relaxed">
          By using NEXSOCIO you agree to our community guidelines, content policies, and acceptable use terms.
        </p>
      </Panel>
      <Panel open title="Privacy policy">
        <p className="text-xs text-[#8A8A8A] leading-relaxed">
          We protect your data with encryption, ZKP age verification, and granular privacy controls.
        </p>
      </Panel>
      <Panel open title="User agreements">
        <p className="text-xs text-[#8A8A8A]">Creator agreement · Business seller terms · API licence</p>
      </Panel>
    </SettingsSectionShell>
  );
}