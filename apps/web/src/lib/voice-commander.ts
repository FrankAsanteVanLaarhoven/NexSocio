"use client";

export type VoiceAction =
  | { type: "navigate"; path: string }
  | { type: "activate_twin" }
  | { type: "deactivate_twin" }
  | { type: "briefing" }
  | { type: "post"; body: string }
  | { type: "toggle_hub" }
  | { type: "unknown"; transcript: string };

export function parseVoiceCommand(transcript: string): VoiceAction {
  const t = transcript.toLowerCase().replace(/[.,!?]/g, "").trim();

  if (t.includes("open settings") || t.includes("go to settings")) {
    return { type: "navigate", path: "/settings" };
  }
  if (t.includes("open wallet")) {
    return { type: "navigate", path: "/wallet" };
  }
  if (t.includes("open inbox")) {
    return { type: "navigate", path: "/inbox" };
  }
  if (t.includes("open twin") || t.includes("digital twin")) {
    return { type: "navigate", path: "/twin" };
  }
  if (t.includes("open studio") || t.includes("create reel")) {
    return { type: "navigate", path: "/studio" };
  }
  if (t.includes("go live") || t.includes("open live")) {
    return { type: "navigate", path: "/live" };
  }
  if (t.includes("open hub") || t.includes("world clock") || t.includes("weather")) {
    return { type: "navigate", path: "/hub" };
  }
  if (t.includes("open map") || t.includes("directions") || t.includes("navigation")) {
    return { type: "navigate", path: "/map" };
  }
  if (t.includes("find me") || t.includes("enable find me") || t.includes("i am lost")) {
    return { type: "navigate", path: "/settings/location" };
  }
  if (t.includes("open find") || t.includes("location finder") || t.includes("find someone")) {
    return { type: "navigate", path: "/find" };
  }
  if (t.includes("stock market") || t.includes("open markets") || t.includes("yahoo finance")) {
    return { type: "navigate", path: "/hub" };
  }
  if (t.includes("open feed") || t.includes("go home")) {
    return { type: "navigate", path: "/" };
  }
  if (t.includes("activate twin") || t.includes("i'm busy")) {
    return { type: "activate_twin" };
  }
  if (t.includes("deactivate twin") || t.includes("i'm back")) {
    return { type: "deactivate_twin" };
  }
  if (t.includes("what happened") || t.includes("read briefing") || t.includes("briefing")) {
    return { type: "briefing" };
  }
  if (t.includes("open hub panel")) {
    return { type: "toggle_hub" };
  }
  const postMatch = t.match(/^(post|publish|share)\s+(.+)$/);
  if (postMatch) {
    return { type: "post", body: postMatch[2] };
  }

  return { type: "unknown", transcript: t };
}