"use client";

import { Panel } from "@nexus/ui";
import { StatCard } from "@/components/settings/SettingsSectionShell";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";
import { useSettingsStore } from "@/lib/settings-store";

export default function MonetizationSettingsPage() {
  const { bonusCoins } = useSettingsStore();

  return (
    <SettingsSectionShell section="monetization">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Bonus coins" value={String(bonusCoins)} />
        <StatCard label="Live rewards" value="£48" trend="This month" />
      </div>
      <Panel open title="Subscriptions manager">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-[#1F1F1F]">
            <span className="text-[#F5F5F5]">NEXSOCIO Premium</span>
            <span className="text-[#00E5FF]">Active</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#1F1F1F]">
            <span className="text-[#F5F5F5]">Business Pro</span>
            <span className="text-[#5A5A5A]">Upgrade</span>
          </div>
        </div>
      </Panel>
      <Panel open title="Campaigns">
        <p className="text-xs text-[#8A8A8A]">Run ads, boost posts, and track ROI from the professional dashboard.</p>
      </Panel>
      <Panel open title="Promotions & gifts">
        <p className="text-xs text-[#8A8A8A]">Send gifts, bonus coins, and crypto tokens to your community.</p>
      </Panel>
      <Panel open title="Live rewards">
        <p className="text-xs text-[#8A8A8A]">Monetise live streams with tips, rewards, and subscriber perks.</p>
      </Panel>
      <Panel open title="Tax info">
        <p className="text-xs text-[#8A8A8A]">Add VAT/tax ID for payouts and business invoicing.</p>
        <button type="button" className="mt-2 text-xs text-[#00E5FF] hover:underline">Add tax details</button>
      </Panel>
    </SettingsSectionShell>
  );
}