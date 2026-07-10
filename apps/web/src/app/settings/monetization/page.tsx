"use client";

import { useCallback, useEffect, useState } from "react";
import type { CreatorDashboard } from "@nexus/types";
import { Button, Panel } from "@nexus/ui";
import { StatCard, SettingsSectionShell } from "@/components/settings/SettingsSectionShell";
import { useTranslation } from "@/i18n";
import { useAuthStore } from "@/lib/auth-store";
import { buyNexCoins, getCreatorDashboard, payoutCreatorBalance } from "@/lib/api";

export default function MonetizationSettingsPage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const [dash, setDash] = useState<CreatorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setDash(await getCreatorDashboard(session.accessToken));
    } catch {
      setDash(null);
      setMsg(t("creator.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [session, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleBuy(packId: "starter" | "popular" | "pro") {
    if (!session) return;
    setActing(packId);
    setMsg(null);
    try {
      await buyNexCoins(session.accessToken, packId);
      setMsg(t("creator.buySuccess"));
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("errors.generic"));
    } finally {
      setActing(null);
    }
  }

  async function handlePayout() {
    if (!session) return;
    setActing("payout");
    setMsg(null);
    try {
      await payoutCreatorBalance(session.accessToken);
      setMsg(t("creator.payoutSuccess"));
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("errors.generic"));
    } finally {
      setActing(null);
    }
  }

  const gbp = (n: number) => `£${n.toFixed(2)}`;

  return (
    <SettingsSectionShell section="monetization">
      {!session ? null : loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
        </div>
      ) : dash ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t("creator.nexCoins")} value={String(dash.nex_coins)} trend={t("creator.thisMonth")} />
            <StatCard
              label={t("creator.creatorBalance")}
              value={gbp(dash.creator_balance)}
              trend={t("creator.thisMonth")}
            />
            <StatCard
              label={t("creator.qualifiedViews")}
              value={String(dash.qualified_views_month)}
              trend={t("creator.thisMonth")}
            />
            <StatCard
              label={t("creator.rewardsEstimate")}
              value={gbp(dash.rewards_estimate_gbp)}
              trend={t("creator.per1kViews")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label={t("creator.giftsEarned")}
              value={gbp(dash.gifts_earned_month_gbp)}
              trend={t("creator.giftCut")}
            />
            <StatCard
              label={t("creator.affiliateEarned")}
              value={gbp(dash.affiliate_earned_month_gbp)}
              trend={t("creator.thisMonth")}
            />
          </div>

          <Panel open title={t("creator.buyCoins")}>
            <div className="flex flex-wrap gap-2">
              {dash.coin_packs.map((pack) => (
                <Button
                  key={pack.id}
                  size="sm"
                  variant="secondary"
                  loading={acting === pack.id}
                  disabled={!!acting}
                  onClick={() => handleBuy(pack.id as "starter" | "popular" | "pro")}
                >
                  {t("creator.buyPack", { coins: pack.coins, price: pack.price_gbp.toFixed(2) })}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-[#5A5A5A]">{t("creator.qualifiedViewRule")}</p>
          </Panel>

          <Panel open title={t("creator.payout")}>
            <p className="text-xs text-[#8A8A8A]">{t("creator.payoutHint")}</p>
            <Button
              className="mt-3"
              size="sm"
              loading={acting === "payout"}
              disabled={!dash.creator_balance || !!acting}
              onClick={handlePayout}
            >
              {t("creator.payout")} ({gbp(dash.creator_balance)})
            </Button>
          </Panel>

          <Panel open title={t("creator.recentEarnings")}>
            {dash.recent_earnings.length === 0 ? (
              <p className="text-xs text-[#8A8A8A]">{t("creator.noEarnings")}</p>
            ) : (
              <div className="space-y-2">
                {dash.recent_earnings.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between border-b border-[#1F1F1F] py-2 text-xs"
                  >
                    <span className="text-[#F5F5F5]">{e.label}</span>
                    <span className="text-[#00E5FF]">+{gbp(e.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {msg && <p className="text-xs text-[#00E5FF]">{msg}</p>}
        </div>
      ) : (
        <p className="text-xs text-[#8A8A8A]">{t("creator.loadFailed")}</p>
      )}
    </SettingsSectionShell>
  );
}