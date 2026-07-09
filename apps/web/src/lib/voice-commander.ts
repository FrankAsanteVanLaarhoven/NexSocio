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