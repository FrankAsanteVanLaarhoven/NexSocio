"use client";

import { useEffect, useState } from "react";
import type { GiftCatalogItem } from "@nexus/types";
import { listGiftCatalog, sendLiveGift } from "@/lib/api";
import { useTranslation } from "@/i18n";

export function LiveGiftPanel({
  token,
  recipientId,
  liveSessionId,
  onSent,
}: {
  token: string;
  recipientId: string;
  liveSessionId?: string;
  onSent?: (earned: number) => void;
}) {
  const { t } = useTranslation();
  const [gifts, setGifts] = useState<GiftCatalogItem[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    listGiftCatalog().then(setGifts).catch(() => setGifts([]));
  }, []);

  async function send(giftId: string) {
    setSending(giftId);
    setMsg(null);
    try {
      const res = await sendLiveGift(token, {
        recipient_id: recipientId,
        gift_id: giftId,
        live_session_id: liveSessionId,
      });
      setMsg(`${res.gift_emoji} ${res.gift_name} ${t("feed.giftSent")}`);
      onSent?.(res.creator_earned);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("creator.giftFailed"));
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-[#5A5A5A]">{t("creator.sendGift")}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {gifts.map((g) => (
          <button
            key={g.id}
            type="button"
            disabled={!!sending}
            onClick={() => send(g.id)}
            className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-[#2A2A2A] px-3 py-2 hover:border-accent/40 disabled:opacity-50"
          >
            <span className="text-xl">{g.emoji}</span>
            <span className="text-[9px] text-[#8A8A8A]">{t("creator.coins", { n: g.coin_cost })}</span>
          </button>
        ))}
      </div>
      {msg && <p className="text-[10px] text-accent">{msg}</p>}
    </div>
  );
}