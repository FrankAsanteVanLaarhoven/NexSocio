"use client";

import { useEffect, useRef } from "react";
import { Button, FadeIn, Panel } from "@nexus/ui";
import type { Meeting } from "@nexus/types";
import { useWebRTCRoom } from "@/hooks/useWebRTCRoom";
import { useTranslation } from "@/i18n";

interface MeetingRoomViewProps {
  token: string;
  userId: string;
  meeting: Meeting;
  onLeave: () => void;
}

export function MeetingRoomView({ token, userId, meeting, onLeave }: MeetingRoomViewProps) {
  const { t } = useTranslation();
  const localRef = useRef<HTMLVideoElement>(null);
  const {
    localStream,
    remoteStreams,
    peerCount,
    state,
    error,
    muted,
    hangup,
    toggleMute,
  } = useWebRTCRoom({
    token,
    roomCode: meeting.room_code,
    userId,
    video: true,
    kind: "meeting",
    enabled: true,
    initiatorOnJoin: true,
    onEnded: onLeave,
  });

  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = localStream;
  }, [localStream]);

  function handleLeave() {
    hangup();
    onLeave();
  }

  const remotes = Array.from(remoteStreams.entries());

  return (
    <FadeIn>
      <Panel open title={meeting.title} subtitle={t("common.room", { code: meeting.room_code })}>
        <div className="space-y-4">
          <p className={`text-sm ${state === "connected" ? "text-[#00C853]" : "text-[#8A8A8A]"}`}>
            {state === "connected"
              ? t("meetings.participants", { n: peerCount + 1 })
              : state === "connecting"
                ? t("calls.connecting")
                : error || t("meetings.inMeeting")}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-[#2A2A2A]">
              <video
                ref={localRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 left-1 text-[10px] text-[#00E5FF] bg-black/60 px-1 rounded">
                {t("common.you")}
              </span>
            </div>
            {remotes.map(([peerId, stream]) => (
              <RemoteTile key={peerId} peerId={peerId} stream={stream} />
            ))}
            {remotes.length === 0 && (
              <div className="aspect-video rounded-lg border border-dashed border-[#2A2A2A] flex items-center justify-center text-xs text-[#5A5A5A]">
                {t("meetings.waitingOthers")}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" variant="secondary" onClick={toggleMute}>
              {muted ? t("calls.unmute") : t("calls.mute")}
            </Button>
            <Button className="flex-1" variant="secondary" onClick={handleLeave}>
              {t("meetings.leave")}
            </Button>
          </div>
        </div>
      </Panel>
    </FadeIn>
  );
}

function RemoteTile({ peerId, stream }: { peerId: string; stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-[#2A2A2A]">
      <video ref={ref} autoPlay playsInline className="h-full w-full object-cover" />
      <span className="absolute bottom-1 left-1 text-[10px] text-[#8A8A8A] bg-black/60 px-1 rounded truncate max-w-[90%]">
        {peerId.slice(0, 8)}
      </span>
    </div>
  );
}