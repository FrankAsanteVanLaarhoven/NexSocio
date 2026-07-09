"use client";

import { Button } from "@nexus/ui";
import { useEffect, useState } from "react";
import { listenForVoiceCommand, requestMediaPermissions } from "@/lib/auth-methods";

interface VoiceAuthProps {
  onCapture: (templateHash: string, command: string) => void;
  onError: (message: string) => void;
  loading?: boolean;
}

const COMMAND = "Nexus unlock";

export function VoiceAuth({ onCapture, onError, loading }: VoiceAuthProps) {
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState<string | null>(null);
  const [micReady, setMicReady] = useState(false);

  useEffect(() => {
    requestMediaPermissions("microphone")
      .then((stream) => {
        stream?.getTracks().forEach((t) => t.stop());
        setMicReady(true);
      })
      .catch(() => onError("Microphone permission denied. Allow mic access to continue."));
  }, [onError]);

  function startListening() {
    setListening(true);
    setLastHeard(null);
    const stop = listenForVoiceCommand(
      (result) => {
        setLastHeard(result.transcript);
        onCapture(result.audioHash, result.transcript);
        setListening(false);
        stop();
      },
      (msg) => {
        onError(msg);
        setListening(false);
        stop();
      }
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="rounded-lg border border-[#2A2A2A] bg-[#111111] px-4 py-6">
        <p className="text-xs uppercase tracking-widest text-[#8A8A8A]">Say this command</p>
        <p className="mt-2 text-lg font-medium text-[#00E5FF]">&ldquo;{COMMAND}&rdquo;</p>
        <p className="mt-3 text-[10px] text-[#5A5A5A]">
          Voice print is hashed locally — raw audio is never stored.
        </p>
      </div>
      {lastHeard && (
        <p className="text-xs text-[#8A8A8A]">
          Heard: <span className="text-[#F5F5F5]">{lastHeard}</span>
        </p>
      )}
      <Button
        className="w-full"
        loading={loading || listening}
        disabled={!micReady}
        onClick={startListening}
      >
        {listening ? "Listening…" : "Start Voice Recognition"}
      </Button>
    </div>
  );
}