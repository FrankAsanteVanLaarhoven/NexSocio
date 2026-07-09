"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { pingLocation } from "@/lib/location";
import { useSettingsStore } from "@/lib/settings-store";

const PING_INTERVAL_MS = 60_000;

export function useLocationTracker(isLive = false) {
  const session = useAuthStore((s) => s.session);
  const findMe = useSettingsStore((s) => s.findMeEnabled);
  const shareWithFollowers = useSettingsStore((s) => s.shareLocationWithFollowers);
  const ticking = useRef(false);

  const shouldTrack = !!session && (findMe || shareWithFollowers || isLive);

  useEffect(() => {
    if (!shouldTrack || !session) return;

    async function tick() {
      if (ticking.current) return;
      ticking.current = true;
      try {
        await pingLocation(session!.accessToken, {
          source: findMe ? "find_me" : isLive ? "live" : "app",
          isLive,
        });
      } catch {
        /* silent */
      } finally {
        ticking.current = false;
      }
    }

    tick();
    const id = setInterval(tick, PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [shouldTrack, session, findMe, isLive]);
}