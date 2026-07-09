import { getIceServers as fetchIceServers } from "@/lib/api";

export type SignalingMessage =
  | { type: "offer"; sdp: RTCSessionDescriptionInit; from?: string; to?: string }
  | { type: "answer"; sdp: RTCSessionDescriptionInit; from?: string; to?: string }
  | { type: "ice"; candidate: RTCIceCandidateInit; from?: string; to?: string }
  | { type: "peer-joined"; user_id: string; from?: string }
  | { type: "peer-left"; user_id: string; from?: string }
  | { type: "room-state"; peers: string[] }
  | { type: "hangup"; from?: string; to?: string };

const DEFAULT_ICE: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

let cachedIce: RTCIceServer[] | null = null;
let cacheToken: string | null = null;

export async function resolveIceServers(token?: string): Promise<RTCIceServer[]> {
  if (!token) return DEFAULT_ICE;
  if (cachedIce && cacheToken === token) return cachedIce;
  try {
    const servers = await fetchIceServers(token);
    cachedIce = servers.length ? servers : DEFAULT_ICE;
    cacheToken = token;
    return cachedIce;
  } catch {
    return DEFAULT_ICE;
  }
}

export function createPeerConnection(iceServers: RTCIceServer[]): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers });
}

export async function getCallMedia(video: boolean): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: true,
    video: video
      ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
      : false,
  });
}

export function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}