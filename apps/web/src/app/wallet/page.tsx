"use client";

import Link from "next/link";
import { Button, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { StatCard } from "@/components/settings/SettingsSectionShell";
import { getWallet, getWalletTransactions, setPaymentProvider } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

function formatAmount(amount: number, currency: string) {
  const sym = currency === "GBP" ? "£" : currency === "USD" ? "$" : `${currency} `;
  const prefix = amount >= 0 ? "+" : "";
  return `${prefix}${sym}${Math.abs(amount).toFixed(2)}`;
}

export default function WalletPage() {
  const session = useAuthStore((s) => s.session);
  const [balance, setBalance] = useState("—");
  const [coins, setCoins] = useState(0);
  const [stripeOn, setStripeOn] = useState(false);
  const [paypalOn, setPaypalOn] = useState(false);
  const [transactions, setTransactions] = useState<
    { id: string; label: string; amount: string; date: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [wallet, txns] = await Promise.all([
        getWallet(session.accessToken),
        getWalletTransactions(session.accessToken),
      ]);
      const sym = wallet.currency === "GBP" ? "£" : wallet.currency;
      setBalance(`${sym}${wallet.balance.toFixed(2)}`);
      setCoins(wallet.bonus_coins);
      setStripeOn(wallet.stripe_connected);
      setPaypalOn(wallet.paypal_connected);
      setTransactions(
        txns.map((t) => ({
          id: t.id,
          label: t.label,
          amount: formatAmount(t.amount, t.currency),
          date: new Date(t.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
        }))
      );
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleProvider(provider: "stripe" | "paypal", connected: boolean) {
    if (!session) return;
    const wallet = await setPaymentProvider(session.accessToken, provider, connected);
    setStripeOn(wallet.stripe_connected);
    setPaypalOn(wallet.paypal_connected);
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-5 pb-12">
            <div className="flex items-center gap-3">
              <Link href="/settings" className="text-xs text-[#8A8A8A] hover:text-[#00E5FF]">
                ← Settings
              </Link>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Wallet</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">
                Pay on{" "}
                <Link href="/marketplace" className="text-[#00E5FF] hover:underline">
                  Marketplace
                </Link>
                {" "}· Stripe · PayPal · crypto
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Balance" value={loading ? "…" : balance} />
              <StatCard label="Bonus coins" value={String(coins)} />
            </div>
            <Panel open title="Payment methods">
              <button type="button" className="w-full text-left py-3 border-b border-[#1F1F1F] text-sm text-[#F5F5F5]">
                ＋ Add card or bank account
              </button>
              <div className="py-2 text-xs text-[#5A5A5A]">Wallet balance used for marketplace checkout</div>
            </Panel>
            <Panel open title="Stripe">
              <Button
                size="sm"
                variant={stripeOn ? "secondary" : "primary"}
                className="w-full"
                onClick={() => toggleProvider("stripe", !stripeOn)}
              >
                {stripeOn ? "Stripe connected ✓" : "Connect Stripe"}
              </Button>
            </Panel>
            <Panel open title="PayPal">
              <Button
                size="sm"
                variant={paypalOn ? "secondary" : "primary"}
                className="w-full"
                onClick={() => toggleProvider("paypal", !paypalOn)}
              >
                {paypalOn ? "PayPal connected ✓" : "Connect PayPal"}
              </Button>
            </Panel>
            <Panel open title="Crypto & tokens">
              <p className="text-xs text-[#8A8A8A]">NEXSOCIO tokens, bonus coins, and airdrops appear here.</p>
              <div className="mt-2 flex gap-2">
                <span className="text-xs px-2 py-1 rounded border border-[#7C4DFF]/40 text-[#7C4DFF]">NEXS 420</span>
                <span className="text-xs px-2 py-1 rounded border border-[#FFB300]/40 text-[#FFB300]">{coins} coins</span>
              </div>
            </Panel>
            <Panel open title="Transactions">
              {loading ? (
                <p className="text-xs text-[#5A5A5A]">Loading…</p>
              ) : transactions.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">No transactions yet — shop on Marketplace</p>
              ) : (
                transactions.map((t) => (
                  <div key={t.id} className="flex justify-between py-2 border-b border-[#1F1F1F] text-xs">
                    <span className="text-[#F5F5F5]">{t.label}</span>
                    <span className={t.amount.startsWith("+") ? "text-[#00C853]" : "text-[#FF5252]"}>
                      {t.amount}
                    </span>
                  </div>
                ))
              )}
            </Panel>
            <Panel open title="Payouts & refunds">
              <p className="text-xs text-[#8A8A8A]">Sales payouts and refunds appear in transactions.</p>
            </Panel>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}