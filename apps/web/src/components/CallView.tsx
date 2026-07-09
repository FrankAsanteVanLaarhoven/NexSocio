"use client";

import { useEffect, useRef } from "react";
import { Button, FadeIn, Panel } from "@nexus/ui";
import type { CallSession } from "@nexus/types";
import { useWebRTCCall } from "@/hooks/useWebRTCCall";

interface CallViewProps {
  token: string;
  userId: string;
  call: CallSession;
  role: "caller" | "callee";
  peerName: string;
  onEnd: () => void;
}

export function CallView({ token, userId, call, role, peerName, onEnd }: CallViewProps) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { localStream, remoteStream, state, error, muted, hangup, toggleMute } = useWebRTCCall({
    token,
    call,
    userId,
    role,
    enabled: call.status === "active" || (role === "caller" && call.status === "ringing"),
    onEnded: onEnd,
  });

  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = remoteStream;
    if (audioRef.current) audioRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const statusLabel =
    state === "connected"
      ? "Connected"
      : state === "ringing"
        ? "Ringing…"
        : state === "connecting"
          ? "Connecting…"
          : state === "error"
            ? error || "Error"
            : "Call";

  return (
    <FadeIn>
      <Panel open title={`${call.call_type} call · ${peerName}`}>
        <div className="space-y-4">
          <p
            className={`text-sm ${
              state === "connected" ? "text-[#00C853]" : "text-[#8A8A8A]"
            }`}
          >
            {statusLabel}
          </p>

          {call.call_type === "video" && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#2A2A2A]">
              <video
                ref={remoteRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              <video
                ref={localRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-2 right-2 h-24 w-20 rounded-lg border border-[#00E5FF]/30 object-cover"
              />
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-[#5A5A5A]">
                  Waiting for {peerName}…
                </div>
              )}
            </div>
          )}

          {call.call_type === "voice" && (
            <div className="rounded-xl border border-[#2A2A2A] bg-[#0A0A0A] py-10 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 text-2xl">
                ☎
              </div>
              <p className="text-sm text-[#F5F5F5]">{peerName}</p>
              <audio ref={audioRef} autoPlay playsInline className="sr-only" />
            </div>
          )}

          <div className="flex gap-2">
            <Button className="flex-1" variant="secondary" onClick={toggleMute}>
              {muted ? "Unmute" : "Mute"}
            </Button>
            <Button className="flex-1" variant="secondary" onClick={hangup}>
              End
            </Button>
          </div>
        </div>
      </Panel>
    </FadeIn>
  );
}