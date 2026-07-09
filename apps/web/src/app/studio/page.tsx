"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { MediaUploader } from "@/components/MediaUploader";
import { composeWithAI, createMediaPost, getMe } from "@/lib/api";
import type { UploadedMedia } from "@/lib/media-upload";
import { useAuthStore } from "@/lib/auth-store";
import { readFileAsDataUrl, renderTalkingAvatar } from "@/lib/talking-avatar";

const FILTERS = [
  { id: "none", label: "Original" },
  { id: "cyber", label: "Cyber", css: "saturate(1.4) contrast(1.1) hue-rotate(180deg)" },
  { id: "warm", label: "Warm", css: "sepia(0.35) saturate(1.2)" },
  { id: "mono", label: "Mono", css: "grayscale(1) contrast(1.15)" },
  { id: "neon", label: "Neon", css: "saturate(2) contrast(1.3) brightness(1.1)" },
  { id: "vintage", label: "Vintage", css: "sepia(0.6) contrast(0.9)" },
];

type StudioMode = "reel" | "photo" | "ai_video";

export default function StudioPage() {
  const session = useAuthStore((s) => s.session);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState("none");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);
  const [aiScript, setAiScript] = useState("");
  const [mode, setMode] = useState<StudioMode>("reel");
  const [loading, setLoading] = useState(false);
  const [usedAi, setUsedAi] = useState(false);
  const [hideAiTag, setHideAiTag] = useState(false);
  const [canHideAiTag, setCanHideAiTag] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia | null>(null);

  useEffect(() => {
    if (!session) return;
    getMe(session.accessToken)
      .then((me) => setCanHideAiTag(!!me.can_hide_ai_tag))
      .catch(() => setCanHideAiTag(false));
  }, [session]);

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: mode === "reel",
    });
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
    const data = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(data);
    if (mode === "ai_video") setAvatarPhoto(data);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await readFileAsDataUrl(file);
    if (mode === "ai_video") {
      setAvatarPhoto(data);
      setPreview(null);
    } else {
      setPreview(data);
    }
  }

  async function handleAiCaption() {
    if (!session || !caption.trim()) return;
    setLoading(true);
    try {
      const result = await composeWithAI(session.accessToken, caption.trim());
      setCaption(result.composed);
      setUsedAi(true);
    } finally {
      setLoading(false);
    }
  }

  async function generateAiVideo() {
    if (!avatarPhoto || !aiScript.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const result = await renderTalkingAvatar(avatarPhoto, aiScript.trim());
      setPreview(result.videoDataUrl);
      setCaption(aiScript.trim());
      setUsedAi(true);
      setMsg("Talking avatar ready — publish when you're happy.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    if (!session || (!preview && !uploadedMedia)) return;
    setLoading(true);
    try {
      const mediaUrl = uploadedMedia?.url || preview!;
      const postType =
        uploadedMedia?.media_type === "video" || mode === "reel" || mode === "ai_video"
          ? "reel"
          : "photo";
      await createMediaPost(session.accessToken, {
        body: caption || (mode === "reel" ? "New reel" : mode === "photo" ? "New photo" : aiScript),
        post_type: mode === "ai_video" ? "reel" : uploadedMedia ? postType : mode,
        media_url: mediaUrl,
        filter_preset: mode === "ai_video" ? "ai-talking-head" : filter,
        context: session.viewContext ?? "personal",
        ai_assisted: usedAi || mode === "ai_video",
        hide_ai_tag: (usedAi || mode === "ai_video") && canHideAiTag && hideAiTag,
      });
      setMsg("Published!");
      setCaption("");
      setPreview(null);
      setUploadedMedia(null);
      setAvatarPhoto(null);
      setAiScript("");
      setUsedAi(false);
      setHideAiTag(false);
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
              <p className="text-xs text-[#8A8A8A] mt-1">
                Reels · photos · cinematic filters · AI talking avatars
              </p>
            </div>
            <div className="flex gap-2">
              {(["reel", "photo", "ai_video"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setPreview(null);
                    setUploadedMedia(null);
                    setMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs uppercase tracking-wider rounded-md border ${
                    mode === m
                      ? "border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]"
                      : "border-[#2A2A2A] text-[#8A8A8A]"
                  }`}
                >
                  {m === "ai_video" ? "AI Avatar" : m}
                </button>
              ))}
            </div>

            {mode === "ai_video" ? (
              <Panel open title="Talking Avatar" subtitle="Photo + speech → realistic lip-sync video">
                <div className="space-y-4">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                  <div className="relative aspect-[9/16] max-h-[420px] mx-auto overflow-hidden rounded-xl border border-[#2A2A2A] bg-black">
                    {preview?.startsWith("data:video") ? (
                      <video src={preview} controls playsInline className="h-full w-full object-cover" />
                    ) : avatarPhoto ? (
                      <img src={avatarPhoto} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" variant="secondary" onClick={() => fileRef.current?.click()}>
                      Upload Photo
                    </Button>
                    <Button className="flex-1" variant="secondary" onClick={startCamera}>
                      Capture
                    </Button>
                    <Button className="flex-1" onClick={capture}>
                      Use Frame
                    </Button>
                  </div>
                  <Input
                    label="Script (what your avatar says)"
                    value={aiScript}
                    onChange={(e) => setAiScript(e.target.value)}
                    placeholder="Hi, I'm here while favl is busy..."
                  />
                  <Button className="w-full" loading={loading} disabled={!avatarPhoto || !aiScript.trim()} onClick={generateAiVideo}>
                    Generate Talking Video
                  </Button>
                  {usedAi && (
                    <label className="flex items-center gap-2 text-xs text-[#8A8A8A]">
                      <input
                        type="checkbox"
                        checked={hideAiTag}
                        disabled={!canHideAiTag}
                        onChange={(e) => setHideAiTag(e.target.checked)}
                        className="accent-[#7C4DFF]"
                      />
                      {canHideAiTag ? "Hide NEXSOCIO AI tag" : "NEXSOCIO AI tag shown (upgrade to hide)"}
                    </label>
                  )}
                  <Button className="w-full" loading={loading} disabled={!preview} onClick={publish}>
                    Publish AI Video
                  </Button>
                </div>
              </Panel>
            ) : (
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
                  <MediaUploader
                    context={mode === "reel" ? "reel" : "photo"}
                    token={session.accessToken}
                    label={mode === "reel" ? "Upload reel (MP4/MOV)" : "Upload photo"}
                    previewUrl={uploadedMedia?.url}
                    onUploaded={(m) => {
                      setUploadedMedia(m);
                      setPreview(null);
                    }}
                    onClear={() => setUploadedMedia(null)}
                    compact
                  />
                  <Button className="w-full" variant="secondary" onClick={startCamera}>
                    Start Camera
                  </Button>
                  <Button className="w-full" onClick={capture}>
                    Capture {mode === "reel" ? "Frame" : "Photo"}
                  </Button>
                  <Input label="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
                  <Button className="w-full" variant="secondary" disabled={!caption.trim()} onClick={handleAiCaption}>
                    Polish caption with NEXSOCIO AI
                  </Button>
                  {usedAi && (
                    <label className="flex items-center gap-2 text-xs text-[#8A8A8A]">
                      <input
                        type="checkbox"
                        checked={hideAiTag}
                        disabled={!canHideAiTag}
                        onChange={(e) => setHideAiTag(e.target.checked)}
                        className="accent-[#7C4DFF]"
                      />
                      {canHideAiTag ? "Hide NEXSOCIO AI tag" : "NEXSOCIO AI tag shown"}
                    </label>
                  )}
                  <Button className="w-full" loading={loading} disabled={!preview && !uploadedMedia} onClick={publish}>
                    Publish {mode}
                  </Button>
                </div>
              </Panel>
            )}
            {msg && <p className="text-xs text-[#00C853]">{msg}</p>}
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}