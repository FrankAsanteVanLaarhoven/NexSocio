"use client";

import Link from "next/link";
import { Panel } from "@nexus/ui";
import { useEffect, useState } from "react";
import { LiveLocationTag } from "@/components/LiveLocationTag";
import { SettingToggle } from "@/components/settings/SettingsSectionShell";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";
import { getMyLocation } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { pingLocation, resolveCurrentPosition } from "@/lib/location";
import { useSettingsStore } from "@/lib/settings-store";

export default function LocationSettingsPage() {
  const session = useAuthStore((s) => s.session);
  const s = useSettingsStore();
  const [status, setStatus] = useState<string | null>(null);
  const [lastLogin, setLastLogin] = useState<{ label: string; at: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!session) return;
    getMyLocation(session.accessToken)
      .then((loc) => {
        if (loc?.last_login_label && loc.last_login_at) {
          setLastLogin({ label: loc.last_login_label, at: loc.last_login_at });
        }
      })
      .catch(() => {});
  }, [session]);

  async function syncNow() {
    if (!session) return;
    setRefreshing(true);
    setStatus(null);
    try {
      const pos = await resolveCurrentPosition();
      await pingLocation(session.accessToken, {
        coords: pos,
        label: pos.label,
        source: s.findMeEnabled ? "find_me" : "app",
      });
      setStatus(`Updated · ${pos.label}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not update location");
    } finally {
      setRefreshing(false);
    }
  }

  async function onToggle(
    key: "findMeEnabled" | "shareLocationWithFollowers" | "showLiveLocationTag" | "trackLoginLocation",
    value: boolean
  ) {
    s.update({ [key]: value });
    if (!session) return;
    try {
      await pingLocation(session.accessToken, {
        source: value && key === "findMeEnabled" ? "find_me" : "app",
      });
    } catch {
      /* silent */
    }
  }

  return (
    <SettingsSectionShell section="location">
      <Panel open title="Find Me — Safety">
        <p className="text-xs text-[#8A8A8A] leading-relaxed mb-3">
          If you get lost while using the app, turn on Find Me so trusted contacts and NexSocio
          members can locate you on the safety map.
        </p>
        <div className="space-y-2">
          <SettingToggle
            label="Find Me (safety mode)"
            hint="Share your live position when you need help"
            on={s.findMeEnabled}
            onChange={(v) => onToggle("findMeEnabled", v)}
          />
          <SettingToggle
            label="Share location with followers"
            hint="Let people who follow you see where you are"
            on={s.shareLocationWithFollowers}
            onChange={(v) => onToggle("shareLocationWithFollowers", v)}
          />
          <SettingToggle
            label="Show live location tag on posts"
            hint="Small tag with place and time when you go live"
            on={s.showLiveLocationTag}
            onChange={(v) => onToggle("showLiveLocationTag", v)}
          />
          <div id="login" />
          <SettingToggle
            label="Track login location"
            hint="Record where each member signs in from"
            on={s.trackLoginLocation}
            onChange={(v) => onToggle("trackLoginLocation", v)}
          />
        </div>
        {s.findMeEnabled && (
          <div className="mt-4 rounded-lg border border-[#FF5252]/30 bg-[#FF5252]/5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-[#FF8A80]">Find Me active</p>
            <p className="text-xs text-[#D4D4D4] mt-1">
              Your position updates every minute while the app is open.
            </p>
            <Link
              href="/find"
              className="inline-block mt-2 text-xs text-[#00E5FF] hover:underline"
            >
              Open safety map →
            </Link>
          </div>
        )}
      </Panel>

      <Panel open title="Your position">
        <div className="space-y-3">
          {lastLogin && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#5A5A5A] mb-1">
                Last login from
              </p>
              <LiveLocationTag label={lastLogin.label} since={lastLogin.at} />
            </div>
          )}
          <button
            type="button"
            onClick={syncNow}
            disabled={refreshing}
            className="text-xs px-3 py-1.5 rounded border border-[#2A2A2A] text-[#8A8A8A] hover:text-[#F5F5F5] hover:border-[#3A3A3A] disabled:opacity-50"
          >
            {refreshing ? "Updating…" : "Refresh location now"}
          </button>
          {status && <p className="text-[10px] text-[#8A8A8A]">{status}</p>}
        </div>
      </Panel>
    </SettingsSectionShell>
  );
}