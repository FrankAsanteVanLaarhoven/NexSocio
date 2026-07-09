"use client";

import { Button } from "@nexus/ui";
import { useEffect, useRef, useState } from "react";
import {
  captureFrameHash,
  capturePalmHash,
  requestMediaPermissions,
} from "@/lib/auth-methods";

interface CameraCaptureProps {
  mode: "face" | "palm";
  onCapture: (templateHash: string) => void;
  onError: (message: string) => void;
  loading?: boolean;
}

export function CameraCapture({ mode, onCapture, onError, loading }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [touchPoints, setTouchPoints] = useState<{ x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    requestMediaPermissions("camera")
      .then((media) => {
        if (!active || !media) return;
        setStream(media);
        if (videoRef.current) {
          videoRef.current.srcObject = media;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setReady(true);
          };
        }
      })
      .catch(() => onError("Camera permission denied. Allow camera access to continue."));

    return () => {
      active = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [stream]);

  function handleTouch(e: React.TouchEvent | React.MouseEvent) {
    if (mode !== "palm" || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const point =
      "touches" in e
        ? { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
        : { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setTouchPoints((prev) => [...prev.slice(-4), point]);
  }

  async function capture() {
    if (!videoRef.current || !ready) return;
    try {
      const hash =
        mode === "palm"
          ? await capturePalmHash(videoRef.current, touchPoints)
          : await captureFrameHash(videoRef.current);
      onCapture(hash);
    } catch {
      onError("Capture failed. Try again.");
    }
  }

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative mx-auto aspect-[4/3] max-w-sm overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]"
        onTouchStart={handleTouch}
        onClick={handleTouch}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover scale-x-[-1]"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className={`border-2 border-dashed ${
              mode === "face"
                ? "h-40 w-32 rounded-[50%] border-[#00E5FF]/50"
                : "h-36 w-36 rounded-lg border-[#7C4DFF]/50"
            }`}
          />
        </div>
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A]/80">
            <p className="text-xs text-[#8A8A8A]">Starting camera…</p>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-[#8A8A8A]">
        {mode === "face"
          ? "Position your face in the oval. Data stays on-device."
          : "Show your palm in the frame or touch the screen to map palm points."}
      </p>
      {mode === "palm" && touchPoints.length > 0 && (
        <p className="text-center text-[10px] text-[#5A5A5A]">
          Palm touch points: {touchPoints.length}
        </p>
      )}
      <Button className="w-full" loading={loading} disabled={!ready} onClick={capture}>
        {mode === "face" ? "Scan Face" : "Scan Palm"}
      </Button>
    </div>
  );
}