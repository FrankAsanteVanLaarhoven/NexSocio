"use client";

import type { CallSession } from "@nexus/types";
import { useWebRTCRoom } from "@/hooks/useWebRTCRoom";

interface UseWebRTCCallOptions {
  token: string;
  call: CallSession | null;
  userId: string;
  role: "caller" | "callee";
  enabled: boolean;
  onEnded?: () => void;
}

export function useWebRTCCall({
  token,
  call,
  userId,
  role,
  enabled,
  onEnded,
}: UseWebRTCCallOptions) {
  const active =
    enabled &&
    !!call &&
    (call.status === "active" || (role === "caller" && call.status === "ringing"));

  return useWebRTCRoom({
    token,
    roomCode: call?.room_code ?? "",
    userId,
    video: call?.call_type === "video",
    kind: "call",
    enabled: active,
    initiatorOnJoin: role === "caller",
    onEnded,
  });
}