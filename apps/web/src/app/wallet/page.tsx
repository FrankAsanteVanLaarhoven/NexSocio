"use client";

import Link from "next/link";
import { Button, Panel } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { StatCard } from "@/components/settings/SettingsSectionShell";
import { useAuthStore } from "@/lib/auth-store";
import { useSettingsStore } from "@/lib/settings-store";

const TRANSACTIONS = [
  { id: "1", type: "purchase", label: "Premium subscription", amount: "-£9.99", date: "Jul 8" },
  { id: "2", type: "payout", label: "Live rewards", amount: "+£24.00", date: "Jul 7" },
  { id: "3", type: "refund", label: "Order #1042 refund", amount: "+£12.50", date: "Jul 5" },
];

export default function WalletPage() {
  const session = useAuthStore((s) => s.session);
  const s = useSettingsStore();

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-5 pb-12">
            <div className="flex items-center gap-3">
              <Link href="/settings" className="text-xs text-[#8A8A8A] hover:text-[#00E5FF]">← Settings</Link>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Wallet</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">Cards · Stripe · PayPal · crypto · payouts</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Balance" value="£142.50" />
              <StatCard label="Bonus coins" value={String(s.bonusCoins)} />
            </div>
            <Panel open title="Payment methods">
              <button type="button" className="w-full text-left py-3 border-b border-[#1F1F1F] text-sm text-[#F5F5F5]">
                ＋ Add card or bank account
              </button>
              <div className="py-2 text-xs text-[#5A5A5A]">•••• 4242 · Exp 12/28</div>
            </Panel>
            <Panel open title="Stripe">
              <Button
                size="sm"
                variant={s.stripeConnected ? "secondary" : "primary"}
                className="w-full"
                onClick={() => s.update({ stripeConnected: !s.stripeConnected })}
              >
                {s.stripeConnected ? "Stripe connected ✓" : "Connect Stripe"}
              </Button>
            </Panel>
            <Panel open title="PayPal">
              <Button
                size="sm"
                variant={s.paypalConnected ? "secondary" : "primary"}
                className="w-full"
                onClick={() => s.update({ paypalConnected: !s.paypalConnected })}
              >
                {s.paypalConnected ? "PayPal connected ✓" : "Connect PayPal"}
              </Button>
            </Panel>
            <Panel open title="Crypto & tokens">
              <p className="text-xs text-[#8A8A8A]">NEXSOCIO tokens, bonus coins, and airdrops appear here.</p>
              <div className="mt-2 flex gap-2">
                <span className="text-xs px-2 py-1 rounded border border-[#7C4DFF]/40 text-[#7C4DFF]">NEXS 420</span>
                <span className="text-xs px-2 py-1 rounded border border-[#FFB300]/40 text-[#FFB300]">{s.bonusCoins} coins</span>
              </div>
            </Panel>
            <Panel open title="Transactions">
              {TRANSACTIONS.map((t) => (
                <div key={t.id} className="flex justify-between py-2 border-b border-[#1F1F1F] text-xs">
                  <span className="text-[#F5F5F5]">{t.label}</span>
                  <span className={t.amount.startsWith("+") ? "text-[#00C853]" : "text-[#FF5252]"}>{t.amount}</span>
                </div>
              ))}
            </Panel>
            <Panel open title="Payouts & refunds">
              <p className="text-xs text-[#8A8A8A]">Platform fees, refunds, and deductions are listed here.</p>
            </Panel>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}