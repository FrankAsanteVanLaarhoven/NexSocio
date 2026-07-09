import type { LocationSource } from "@nexus/types";
import { updateLocation } from "@/lib/api";
import { useSettingsStore } from "@/lib/settings-store";

export interface GeoCoords {
  lat: number;
  lng: number;
}

export interface GeoPosition extends GeoCoords {
  label: string;
}

const labelCache = new Map<string, string>();

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export function getCurrentPosition(): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = cacheKey(lat, lng);
  const cached = labelCache.get(key);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
      { headers: { Accept: "application/json" } }
    );
    if (res.ok) {
      const data = (await res.json()) as {
        address?: {
          city?: string;
          town?: string;
          village?: string;
          suburb?: string;
          state?: string;
          country?: string;
        };
        display_name?: string;
      };
      const a = data.address;
      const parts = [a?.suburb, a?.city || a?.town || a?.village, a?.state, a?.country].filter(
        Boolean
      );
      const label = parts.length ? parts.join(", ") : data.display_name?.split(",").slice(0, 2).join(", ") || "Unknown area";
      labelCache.set(key, label);
      return label;
    }
  } catch {
    /* fallback below */
  }

  const fallback = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  labelCache.set(key, fallback);
  return fallback;
}

export async function resolveCurrentPosition(): Promise<GeoPosition> {
  const coords = await getCurrentPosition();
  const label = await reverseGeocode(coords.lat, coords.lng);
  return { ...coords, label };
}

export function formatLocationAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export async function pingLocation(
  token: string,
  opts: {
    source?: LocationSource;
    isLive?: boolean;
    coords?: GeoCoords;
    label?: string;
  } = {}
): Promise<void> {
  const settings = useSettingsStore.getState();
  const active =
    settings.findMeEnabled ||
    settings.shareLocationWithFollowers ||
    settings.trackLoginLocation ||
    opts.isLive;

  if (!active && opts.source !== "login") return;
  if (opts.source === "login" && !settings.trackLoginLocation) return;

  let lat = opts.coords?.lat;
  let lng = opts.coords?.lng;
  let locationLabel = opts.label;

  if (lat == null || lng == null) {
    try {
      const pos = await resolveCurrentPosition();
      lat = pos.lat;
      lng = pos.lng;
      locationLabel = locationLabel || pos.label;
    } catch {
      return;
    }
  }

  await updateLocation(token, {
    lat: lat!,
    lng: lng!,
    location_label: locationLabel || (await reverseGeocode(lat!, lng!)),
    find_me_enabled: settings.findMeEnabled,
    share_with_followers: settings.shareLocationWithFollowers,
    show_live_tag: settings.showLiveLocationTag,
    is_live: opts.isLive ?? false,
    source: opts.source ?? (settings.findMeEnabled ? "find_me" : "app"),
  });
}

export function recordLoginLocation(token: string): void {
  const { trackLoginLocation } = useSettingsStore.getState();
  if (!trackLoginLocation) return;
  pingLocation(token, { source: "login" }).catch(() => {});
}