"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { callSignalingWsUrl } from "@/lib/api";
import {
  createPeerConnection,
  getCallMedia,
  resolveIceServers,
  stopMediaStream,
  type SignalingMessage,
} from "@/lib/webrtc";

export type RoomConnectionState =
  | "idle"
  | "connecting"
  | "ringing"
  | "connected"
  | "ended"
  | "error";

export interface UseWebRTCRoomOptions {
  token: string;
  roomCode: string;
  userId: string;
  video: boolean;
  kind: "call" | "meeting";
  enabled: boolean;
  /** For 1:1 calls: caller creates offer on peer-joined */
  initiatorOnJoin?: boolean;
  onEnded?: () => void;
}

export function useWebRTCRoom({
  token,
  roomCode,
  userId,
  video,
  kind,
  enabled,
  initiatorOnJoin = true,
  onEnded,
}: UseWebRTCRoomOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [state, setState] = useState<RoomConnectionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const updateRemoteStreams = useCallback(() => {
    const streams = new Map<string, MediaStream>();
    pcsRef.current.forEach((pc, peerId) => {
      const receivers = pc.getReceivers();
      const tracks = receivers.map((r) => r.track).filter(Boolean) as MediaStreamTrack[];
      if (tracks.length) {
        streams.set(peerId, new MediaStream(tracks));
      }
    });
    setRemoteStreams(streams);
    setPeerCount(streams.size);
    if (streams.size > 0) setState("connected");
  }, []);

  const cleanup = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();
    stopMediaStream(localStreamRef.current);
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStreams(new Map());
    setPeerCount(0);
  }, []);

  const sendSignal = useCallback((message: SignalingMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const hangup = useCallback(() => {
    sendSignal({ type: "hangup" });
    cleanup();
    setState("ended");
    onEndedRef.current?.();
  }, [cleanup, sendSignal]);

  const toggleMute = useCallback(() => {
    const audio = localStreamRef.current?.getAudioTracks()[0];
    if (!audio) return;
    audio.enabled = !audio.enabled;
    setMuted(!audio.enabled);
  }, []);

  const getOrCreatePc = useCallback(
    (peerId: string): RTCPeerConnection => {
      let pc = pcsRef.current.get(peerId);
      if (pc) return pc;

      pc = createPeerConnection(iceServersRef.current);
      pcsRef.current.set(peerId, pc);

      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => pc!.addTrack(track, stream));
      }

      pc.ontrack = () => updateRemoteStreams();
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: "ice",
            candidate: event.candidate.toJSON(),
            to: peerId,
          });
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") updateRemoteStreams();
        if (pc.connectionState === "failed") {
          setError("Connection failed");
          setState("error");
        }
      };

      return pc;
    },
    [sendSignal, updateRemoteStreams]
  );

  const createOfferTo = useCallback(
    async (peerId: string) => {
      try {
        const pc = getOrCreatePc(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal({ type: "offer", sdp: offer, to: peerId });
        setState("connecting");
      } catch {
        setError("Failed to create offer");
        setState("error");
      }
    },
    [getOrCreatePc, sendSignal]
  );

  useEffect(() => {
    if (!enabled || !roomCode || !token) {
      cleanup();
      setState("idle");
      return;
    }

    let cancelled = false;

    async function start() {
      setState("connecting");
      setError(null);

      try {
        iceServersRef.current = await resolveIceServers(token);
        const stream = await getCallMedia(video);
        if (cancelled) {
          stopMediaStream(stream);
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        const ws = new WebSocket(callSignalingWsUrl(token, roomCode, kind));
        wsRef.current = ws;

        ws.onopen = () => {
          if (kind === "call" && initiatorOnJoin) setState("ringing");
        };

        ws.onmessage = async (event) => {
          let msg: SignalingMessage;
          try {
            msg = JSON.parse(event.data) as SignalingMessage;
          } catch {
            return;
          }

          if (msg.type === "peer-left" || msg.type === "hangup") {
            const leftId = msg.type === "peer-left" ? msg.user_id : undefined;
            if (leftId) {
              pcsRef.current.get(leftId)?.close();
              pcsRef.current.delete(leftId);
              updateRemoteStreams();
            }
            if (kind === "call" || pcsRef.current.size === 0) {
              cleanup();
              setState("ended");
              onEndedRef.current?.();
            }
            return;
          }

          if (msg.type === "room-state") {
            return;
          }

          if (msg.type === "peer-joined" && msg.user_id !== userId) {
            if (initiatorOnJoin) {
              await createOfferTo(msg.user_id);
            }
            return;
          }

          const from = msg.from;
          if (!from || from === userId) return;

          if (msg.type === "offer" && (!msg.to || msg.to === userId)) {
            try {
              const pc = getOrCreatePc(from);
              await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sendSignal({ type: "answer", sdp: answer, to: from });
              setState("connecting");
            } catch {
              setError("Failed to answer");
              setState("error");
            }
            return;
          }

          if (msg.type === "answer" && (!msg.to || msg.to === userId)) {
            try {
              const pc = pcsRef.current.get(from);
              if (pc) await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            } catch {
              setError("Failed to establish connection");
              setState("error");
            }
            return;
          }

          if (msg.type === "ice" && (!msg.to || msg.to === userId)) {
            try {
              const pc = pcsRef.current.get(from);
              if (pc && msg.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
              }
            } catch {
              /* ignore stale ICE */
            }
          }
        };

        ws.onerror = () => {
          if (!cancelled) {
            setError("Signaling connection failed");
            setState("error");
          }
        };
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Media access denied");
          setState("error");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [
    enabled,
    roomCode,
    token,
    userId,
    video,
    kind,
    initiatorOnJoin,
    cleanup,
    sendSignal,
    getOrCreatePc,
    createOfferTo,
    updateRemoteStreams,
  ]);

  const remoteStream = remoteStreams.values().next().value ?? null;

  return {
    localStream,
    remoteStream,
    remoteStreams,
    peerCount,
    state,
    error,
    muted,
    hangup,
    toggleMute,
  };
}