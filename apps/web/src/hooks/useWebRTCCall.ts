"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CallSession } from "@nexus/types";
import { callSignalingWsUrl } from "@/lib/api";
import {
  createPeerConnection,
  getCallMedia,
  stopMediaStream,
  type SignalingMessage,
} from "@/lib/webrtc";

export type CallConnectionState =
  | "idle"
  | "connecting"
  | "ringing"
  | "connected"
  | "ended"
  | "error";

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
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [state, setState] = useState<CallConnectionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const makingOfferRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const cleanup = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    stopMediaStream(localStreamRef.current);
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    makingOfferRef.current = false;
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

  useEffect(() => {
    if (!enabled || !call || call.status === "ended") {
      cleanup();
      setState("idle");
      return;
    }

    let cancelled = false;

    async function start() {
      setState("connecting");
      setError(null);

      try {
        const video = call!.call_type === "video";
        const stream = await getCallMedia(video);
        if (cancelled) {
          stopMediaStream(stream);
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = createPeerConnection();
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          const [remote] = event.streams;
          if (remote) setRemoteStream(remote);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal({ type: "ice", candidate: event.candidate.toJSON() });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") setState("connected");
          if (pc.connectionState === "failed") {
            setError("Connection failed");
            setState("error");
          }
          if (pc.connectionState === "disconnected" || pc.connectionState === "closed") {
            setState("ended");
          }
        };

        const ws = new WebSocket(callSignalingWsUrl(token, call!.room_code));
        wsRef.current = ws;

        ws.onopen = () => {
          if (role === "caller" && call!.status === "ringing") {
            setState("ringing");
          }
        };

        ws.onmessage = async (event) => {
          let msg: SignalingMessage;
          try {
            msg = JSON.parse(event.data) as SignalingMessage;
          } catch {
            return;
          }

          if (msg.type === "peer-left" || msg.type === "hangup") {
            cleanup();
            setState("ended");
            onEndedRef.current?.();
            return;
          }

          if (msg.type === "peer-joined" && role === "caller" && !makingOfferRef.current) {
            try {
              makingOfferRef.current = true;
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sendSignal({ type: "offer", sdp: offer });
              setState("connecting");
            } catch {
              setError("Failed to create offer");
              setState("error");
            }
            return;
          }

          if (msg.type === "offer" && role === "callee") {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sendSignal({ type: "answer", sdp: answer });
              setState("connecting");
            } catch {
              setError("Failed to answer call");
              setState("error");
            }
            return;
          }

          if (msg.type === "answer" && role === "caller") {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            } catch {
              setError("Failed to establish connection");
              setState("error");
            }
            return;
          }

          if (msg.type === "ice" && msg.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch {
              /* ignore stale candidates */
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
          setError(err instanceof Error ? err.message : "Could not access microphone/camera");
          setState("error");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, call?.id, call?.room_code, call?.status, call?.call_type, token, role, cleanup, sendSignal]);

  return {
    localStream,
    remoteStream,
    state,
    error,
    muted,
    hangup,
    toggleMute,
  };
}