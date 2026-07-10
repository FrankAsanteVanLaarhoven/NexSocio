"use client";

import type { CreatorDashboard } from "@nexus/types";
import { Button, Input, Panel } from "@nexus/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { LiveLocationTag } from "@/components/LiveLocationTag";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import { createMediaPost, getCreatorDashboard } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { listOrgMemberships } from "@/lib/api";
import { normalizeSector } from "@/lib/sectors";
import { pingLocation, resolveCurrentPosition } from "@/lib/location";
import { useSettingsStore } from "@/lib/settings-store";
import { useTranslation } from "@/i18n";

export default function LivePage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const activeSector = normalizeSector(session?.viewContext);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (!session || activeSector !== "business_corporate") return;
    listOrgMemberships(session.accessToken)
      .then((m) => setActiveOrgId(m[0]?.org_id ?? null))
      .catch(() => setActiveOrgId(null));
  }, [session, activeSector]);
  const showLiveTag = useSettingsStore((s) => s.showLiveLocationTag);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);
  const [title, setTitle] = useState("");
  const [viewers] = useState(0);
  const [liveLocation, setLiveLocation] = useState<{
    label: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [liveSince, setLiveSince] = useState<string | null>(null);
  const [livePostId, setLivePostId] = useState<string | null>(null);
  const [giftDash, setGiftDash] = useState<CreatorDashboard | null>(null);
  const giftsAtStart = useRef(0);

  useLocationTracker(live);

  const refreshGifts = useCallback(async () => {
    if (!session) return;
    try {
      const dash = await getCreatorDashboard(session.accessToken);
      setGiftDash(dash);
    } catch {
      setGiftDash(null);
    }
  }, [session]);

  useEffect(() => {
    if (!live || !session) return;
    refreshGifts();
    const id = setInterval(refreshGifts, 8000);
    return () => clearInterval(id);
  }, [live, session, refreshGifts]);

  async function goLive() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    let loc: { label: string; lat: number; lng: number } | null = null;
    if (showLiveTag) {
      try {
        const pos = await resolveCurrentPosition();
        loc = { label: pos.label, lat: pos.lat, lng: pos.lng };
        setLiveLocation(loc);
      } catch {
        setLiveLocation(null);
      }
    }

    setLiveSince(new Date().toISOString());
    setLive(true);

    if (session) {
      await pingLocation(session.accessToken, {
        source: "live",
        isLive: true,
        coords: loc ?? undefined,
        label: loc?.label,
      });

      const post = await createMediaPost(session.accessToken, {
        body: title || "🔴 Live now on NexSocio",
        post_type: "live",
        context: activeSector,
        org_id: activeSector === "business_corporate" ? activeOrgId : undefined,
        location_label: loc?.label,
        location_lat: loc?.lat,
        location_lng: loc?.lng,
        is_live_session: true,
      });
      setLivePostId(post.id);
      const dash = await getCreatorDashboard(session.accessToken);
      setGiftDash(dash);
      giftsAtStart.current = dash.gifts_earned_month_gbp;
    }
  }

  async function endLive() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    setLive(false);
    setLiveLocation(null);
    setLiveSince(null);
    setLivePostId(null);
    setGiftDash(null);
    if (session) {
      pingLocation(session.accessToken, { source: "live", isLive: false }).catch(() => {});
    }
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">{t("live.title")}</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">{t("live.subtitle")}</p>
            </div>

            <Panel open title={live ? t("live.livePanel") : t("live.goLive")}>
              <div className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]">
                  <video ref={videoRef} playsInline muted={!live} className="h-full w-full object-cover" />
                  {live && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 rounded bg-[#FF5252]/90 px-2 py-1">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                      <span className="text-[10px] font-bold text-white uppercase">{t("feed.live")}</span>
                    </div>
                  )}
                  {live && liveLocation && showLiveTag && (
                    <div className="absolute bottom-3 left-3">
                      <LiveLocationTag
                        label={liveLocation.label}
                        isLive
                        since={liveSince || undefined}
                        lat={liveLocation.lat}
                        lng={liveLocation.lng}
                        compact
                      />
                    </div>
                  )}
                  {live && (
                    <div className="absolute top-3 right-3 text-[10px] text-white bg-black/50 px-2 py-1 rounded">
                      {t("live.viewers", { n: viewers })}
                    </div>
                  )}
                </div>
                {!live && (
                  <Input label={t("live.streamTitle")} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("live.streamPlaceholder")} />
                )}
                {live ? (
                  <Button className="w-full" variant="danger" onClick={endLive}>
                    {t("live.endStream")}
                  </Button>
                ) : (
                  <Button className="w-full" onClick={goLive}>
                    {t("live.startStream")}
                  </Button>
                )}
                <p className="text-[10px] text-[#5A5A5A] text-center">
                  {showLiveTag ? t("live.locationHint") : t("live.locationDisabled")}
                </p>
              </div>
            </Panel>

            {live && (
              <Panel open title={t("live.giftsTitle")}>
                <p className="text-xs text-[#8A8A8A]">{t("live.giftsHint")}</p>
                {livePostId && (
                  <p className="mt-2 text-[10px] text-[#5A5A5A]">
                    Post ID: {livePostId.slice(0, 8)}…
                  </p>
                )}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[#5A5A5A]">
                      {t("live.giftsEarned")}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#FFB300]">
                      £{Math.max(0, (giftDash?.gifts_earned_month_gbp ?? 0) - giftsAtStart.current).toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[#5A5A5A]">
                      {t("creator.nexCoins")}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#00E5FF]">
                      {giftDash?.nex_coins ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] uppercase tracking-wider text-[#5A5A5A]">
                    {t("live.recentGifts")}
                  </p>
                  {(giftDash?.recent_earnings ?? []).filter((e) => e.source === "live_gift").length === 0 ? (
                    <p className="text-xs text-[#8A8A8A]">{t("live.noGiftsYet")}</p>
                  ) : (
                    (giftDash?.recent_earnings ?? [])
                      .filter((e) => e.source === "live_gift")
                      .slice(0, 5)
                      .map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between text-xs border-b border-[#1F1F1F] py-1.5"
                        >
                          <span className="text-[#F5F5F5]">{e.label}</span>
                          <span className="text-[#FFB300]">+£{e.amount.toFixed(2)}</span>
                        </div>
                      ))
                  )}
                </div>
              </Panel>
            )}
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}