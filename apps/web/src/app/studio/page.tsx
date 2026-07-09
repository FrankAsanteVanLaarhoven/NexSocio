"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { createMediaPost } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const FILTERS = [
  { id: "none", label: "Original" },
  { id: "cyber", label: "Cyber", css: "saturate(1.4) contrast(1.1) hue-rotate(180deg)" },
  { id: "warm", label: "Warm", css: "sepia(0.35) saturate(1.2)" },
  { id: "mono", label: "Mono", css: "grayscale(1) contrast(1.15)" },
  { id: "neon", label: "Neon", css: "saturate(2) contrast(1.3) brightness(1.1)" },
  { id: "vintage", label: "Vintage", css: "sepia(0.6) contrast(0.9)" },
];

export default function StudioPage() {
  const session = useAuthStore((s) => s.session);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [filter, setFilter] = useState("none");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<"reel" | "photo">("reel");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: mode === "reel" });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }

  function capture() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 720;
    canvas.height = videoRef.current.videoHeight || 1280;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const f = FILTERS.find((x) => x.id === filter);
    ctx.filter = f?.css || "none";
    ctx.drawImage(videoRef.current, 0, 0);
    setPreview(canvas.toDataURL("image/jpeg", 0.9));
  }

  async function publish() {
    if (!session || !preview) return;
    setLoading(true);
    try {
      await createMediaPost(session.accessToken, {
        body: caption || (mode === "reel" ? "New reel 🎬" : "New photo 📸"),
        post_type: mode,
        media_url: preview.slice(0, 200) + "...",
        filter_preset: filter,
        context: session.viewContext ?? "personal",
      });
      setMsg("Published! (media stub — full CDN in production)");
      setCaption("");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Studio</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">Reels · photos · TikTok-class filters</p>
            </div>
            <div className="flex gap-2">
              {(["reel", "photo"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-xs uppercase tracking-wider rounded-md border ${
                    mode === m ? "border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]" : "border-[#2A2A2A] text-[#8A8A8A]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <Panel open title="Camera & Filters">
              <div className="space-y-4">
                <div className="relative aspect-[9/16] max-h-[420px] mx-auto overflow-hidden rounded-xl border border-[#2A2A2A] bg-black">
                  {preview ? (
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                      style={{ filter: FILTERS.find((f) => f.id === filter)?.css || "none" }}
                    />
                  )}
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={`shrink-0 px-3 py-1.5 text-[10px] rounded-full border ${
                        filter === f.id ? "border-[#00E5FF] text-[#00E5FF]" : "border-[#2A2A2A] text-[#8A8A8A]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <Button className="w-full" variant="secondary" onClick={startCamera}>
                  Start Camera
                </Button>
                <Button className="w-full" onClick={capture}>
                  Capture {mode === "reel" ? "Frame" : "Photo"}
                </Button>
                <Input label="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
                <Button className="w-full" loading={loading} disabled={!preview} onClick={publish}>
                  Publish {mode}
                </Button>
                {msg && <p className="text-xs text-[#00C853]">{msg}</p>}
              </div>
            </Panel>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}