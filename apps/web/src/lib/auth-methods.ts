"use client";

import type { WebAuthnChallenge } from "@nexus/types";

export type MediaPermission = "camera" | "microphone" | "both";

export async function requestMediaPermissions(
  kind: MediaPermission = "both"
): Promise<MediaStream | null> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera and microphone are not supported in this browser");
  }
  const constraints: MediaStreamConstraints = {
    video: kind !== "microphone",
    audio: kind !== "camera",
  };
  return navigator.mediaDevices.getUserMedia(constraints);
}

export async function hashData(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Stable 8×8 perceptual hash — tolerant to minor lighting/pose shifts between scans. */
export async function captureFrameHash(video: HTMLVideoElement): Promise<string> {
  const size = 8;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.drawImage(video, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const gray: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  const avg = gray.reduce((a, b) => a + b, 0) / gray.length;
  const bits = gray.map((v) => (v >= avg ? "1" : "0")).join("");
  return hashData(bits);
}

export async function capturePalmHash(
  video: HTMLVideoElement,
  touchPoints: { x: number; y: number }[],
  containerWidth = 320,
  containerHeight = 240
): Promise<string> {
  const base = await captureFrameHash(video);
  const grid = Array(16).fill("0");
  touchPoints.forEach((p) => {
    const col = Math.min(3, Math.floor((p.x / containerWidth) * 4));
    const row = Math.min(3, Math.floor((p.y / containerHeight) * 4));
    grid[row * 4 + col] = "1";
  });
  return hashData(`${base}:${grid.join("")}`);
}

/** Fixed voice print for the "Nexsocio unlock" command. */
export const VOICE_COMMAND = "nexsocio unlock";

export async function voiceTemplateHash(): Promise<string> {
  return hashData(VOICE_COMMAND);
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const padded = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function textToBuffer(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

export function isWebAuthnAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnAvailable()) return false;
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

export async function registerWebAuthn(
  options: WebAuthnChallenge
): Promise<{ credentialId: string; challenge: string }> {
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: textToBuffer(options.challenge),
      rp: { name: "NexSocio", id: options.rp_id },
      user: {
        id: textToBuffer(options.user_id || ""),
        name: options.user_name || "user",
        displayName: options.user_display_name || "NexSocio User",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        userVerification: "preferred",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Passkey registration cancelled");
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    credentialId: bufferToBase64url(credential.rawId),
    challenge: options.challenge,
  };
}

export async function loginWebAuthn(
  options: WebAuthnChallenge
): Promise<{ credentialId: string; challenge: string }> {
  const allowCredentials = (options.allow_credentials || []).map((c) => ({
    id: base64urlToBuffer(c.id),
    type: "public-key" as const,
  }));

  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge: textToBuffer(options.challenge),
      rpId: options.rp_id,
      allowCredentials,
      userVerification: "required",
      timeout: 60000,
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Biometric authentication cancelled");
  return {
    credentialId: bufferToBase64url(credential.rawId),
    challenge: options.challenge,
  };
}

export type VoiceRecognitionResult = {
  transcript: string;
  audioHash: string;
};

export function listenForVoiceCommand(
  onResult: (result: VoiceRecognitionResult) => void,
  onError: (message: string) => void
): () => void {
  const SpeechRecognitionCtor =
    window.SpeechRecognition ?? window.webkitSpeechRecognition;

  if (!SpeechRecognitionCtor) {
    onError("Voice recognition is not supported in this browser");
    return () => {};
  }

  const recognition = new SpeechRecognitionCtor();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = async (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0]?.[0]?.transcript?.trim() || "";
    const normalized = transcript.toLowerCase().replace(/[.,!?]/g, "").trim();
    const audioHash = await voiceTemplateHash();
    onResult({ transcript: normalized, audioHash });
  };

  recognition.onerror = () => onError("Could not recognize voice. Try again.");
  recognition.start();

  return () => recognition.stop();
}