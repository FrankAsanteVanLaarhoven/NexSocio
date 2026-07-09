"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { LiveLocationTag } from "@/components/LiveLocationTag";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import { createMediaPost } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { pingLocation, resolveCurrentPosition } from "@/lib/location";
import { useSettingsStore } from "@/lib/settings-store";

export default function LivePage() {
  const session = useAuthStore((s) => s.session);
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

  useLocationTracker(live);

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

      await createMediaPost(session.accessToken, {
        body: title || "🔴 Live now on NEXSOCIO",
        post_type: "live",
        context: session.viewContext ?? "personal",
        location_label: loc?.label,
        location_lat: loc?.lat,
        location_lng: loc?.lng,
        is_live_session: true,
      });
    }
  }

  async function endLive() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    setLive(false);
    setLiveLocation(null);
    setLiveSince(null);
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
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Live</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">
                Stream · followers see your live location tag
              </p>
            </div>

            <Panel open title={live ? "🔴 LIVE" : "Go Live"}>
              <div className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]">
                  <video ref={videoRef} playsInline muted={!live} className="h-full w-full object-cover" />
                  {live && (
                    <div className="absolute top-3 left-3 flex items-center gap-2 rounded bg-[#FF5252]/90 px-2 py-1">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                      <span className="text-[10px] font-bold text-white uppercase">Live</span>
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
                      {viewers} viewers
                    </div>
                  )}
                </div>
                {!live && (
                  <Input label="Stream title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's this stream about?" />
                )}
                {live ? (
                  <Button className="w-full" variant="danger" onClick={endLive}>
                    End Stream
                  </Button>
                ) : (
                  <Button className="w-full" onClick={goLive}>
                    Start Live Stream
                  </Button>
                )}
                <p className="text-[10px] text-[#5A5A5A] text-center">
                  {showLiveTag
                    ? "Followers see a small location + time tag on your live post"
                    : "Enable live location tags in Settings → Location Finder"}
                </p>
              </div>
            </Panel>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}