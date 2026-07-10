"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { MediaUploader } from "@/components/MediaUploader";
import {
  composeWithAI,
  createMediaPost,
  createPodcastEpisode,
  getMe,
  listPodcastEpisodes,
} from "@/lib/api";
import type { PodcastEpisode } from "@nexus/types";
import type { UploadedMedia } from "@/lib/media-upload";
import { useAuthStore } from "@/lib/auth-store";
import { listOrgMemberships } from "@/lib/api";
import {
  allowedFilters,
  normalizeSector,
  studioModesFor,
} from "@/lib/sectors";
import { readFileAsDataUrl, renderTalkingAvatar } from "@/lib/talking-avatar";
import { useTranslation } from "@/i18n";

const FILTERS = [
  { id: "none", label: "Original" },
  { id: "cyber", label: "Cyber", css: "saturate(1.4) contrast(1.1) hue-rotate(180deg)" },
  { id: "warm", label: "Warm", css: "sepia(0.35) saturate(1.2)" },
  { id: "mono", label: "Mono", css: "grayscale(1) contrast(1.15)" },
  { id: "neon", label: "Neon", css: "saturate(2) contrast(1.3) brightness(1.1)" },
  { id: "vintage", label: "Vintage", css: "sepia(0.6) contrast(0.9)" },
];

type StudioMode = "reel" | "photo" | "ai_video" | "podcast" | "vlog" | "tv";

export default function StudioPage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const activeSector = normalizeSector(session?.viewContext);
  const allowedModes = studioModesFor(activeSector);
  const visibleFilters = FILTERS.filter((f) => allowedFilters(activeSector).has(f.id));
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
  const [epTitle, setEpTitle] = useState("");
  const [epDesc, setEpDesc] = useState("");
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (!session || activeSector !== "business_corporate") return;
    listOrgMemberships(session.accessToken)
      .then((m) => setActiveOrgId(m[0]?.org_id ?? null))
      .catch(() => setActiveOrgId(null));
  }, [session, activeSector]);

  useEffect(() => {
    if (!allowedFilters(activeSector).has(filter)) {
      setFilter("none");
    }
    if (!allowedModes.includes(mode)) {
      setMode(allowedModes[0] as StudioMode);
    }
  }, [activeSector, filter, mode, allowedModes]);

  const isBroadcastMode = mode === "podcast" || mode === "vlog" || mode === "tv";

  useEffect(() => {
    if (!session) return;
    getMe(session.accessToken)
      .then((me) => setCanHideAiTag(!!me.can_hide_ai_tag))
      .catch(() => setCanHideAiTag(false));
  }, [session]);

  useEffect(() => {
    if (!session || !isBroadcastMode) return;
    listPodcastEpisodes(session.accessToken, mode)
      .then(setEpisodes)
      .catch(() => setEpisodes([]));
  }, [session, mode, isBroadcastMode]);

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
      setMsg(t("studio.avatarReady"));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t("studio.generationFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function publishEpisode() {
    if (!session || !epTitle.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const mediaUrl = uploadedMedia?.url || preview || undefined;
      await createPodcastEpisode(session.accessToken, {
        title: epTitle.trim(),
        description: epDesc.trim(),
        media_url: mediaUrl,
        episode_type: mode as "podcast" | "vlog" | "tv",
        publish: true,
      });
      setMsg(t("studio.episodePublished", { mode }));
      setEpTitle("");
      setEpDesc("");
      setPreview(null);
      setUploadedMedia(null);
      const list = await listPodcastEpisodes(session.accessToken, mode as "podcast" | "vlog" | "tv");
      setEpisodes(list);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t("studio.publishFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    if (!session || isBroadcastMode || (!preview && !uploadedMedia)) return;
    setLoading(true);
    try {
      const mediaUrl = uploadedMedia?.url || preview!;
      const postType =
        uploadedMedia?.media_type === "video" || mode === "reel" || mode === "ai_video"
          ? "reel"
          : "photo";
      const resolvedPostType =
        mode === "ai_video" ? "reel" : uploadedMedia ? postType : mode === "reel" ? "reel" : "photo";
      await createMediaPost(session.accessToken, {
        body: caption || (mode === "reel" ? "New reel" : mode === "photo" ? "New photo" : aiScript),
        post_type: resolvedPostType,
        media_url: mediaUrl,
        filter_preset: mode === "ai_video" ? "ai-talking-head" : filter,
        context: activeSector,
        org_id: activeSector === "business_corporate" ? activeOrgId : undefined,
        ai_assisted: usedAi || mode === "ai_video",
        hide_ai_tag: (usedAi || mode === "ai_video") && canHideAiTag && hideAiTag,
      });
      setMsg(t("studio.publishSuccess"));
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
              <h1 className="text-xl font-semibold text-[#F5F5F5]">{t("studio.title")}</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">{t("studio.subtitle")}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {allowedModes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m as StudioMode);
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
                  {m === "ai_video" ? t("studio.aiAvatar") : m}
                </button>
              ))}
            </div>

            {isBroadcastMode ? (
              <Panel
                open
                title={mode === "podcast" ? "Podcast" : mode === "vlog" ? "Vlog" : "TV Show"}
                subtitle={t("studio.broadcastSubtitle")}
              >
                <div className="space-y-4">
                  <MediaUploader
                    context={mode === "podcast" ? "reel" : "reel"}
                    token={session.accessToken}
                    label={t("studio.uploadMedia", { mode })}
                    previewUrl={uploadedMedia?.url}
                    onUploaded={(m) => {
                      setUploadedMedia(m);
                      setPreview(null);
                    }}
                    onClear={() => setUploadedMedia(null)}
                    compact
                  />
                  <Input
                    label={t("studio.episodeTitle")}
                    value={epTitle}
                    onChange={(e) => setEpTitle(e.target.value)}
                  />
                  <Input
                    label={t("shop.description")}
                    value={epDesc}
                    onChange={(e) => setEpDesc(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    loading={loading}
                    disabled={!epTitle.trim()}
                    onClick={publishEpisode}
                  >
                    {t("studio.publishEpisode", { mode })}
                  </Button>
                  {episodes.length > 0 && (
                    <div className="space-y-2 border-t border-[#1F1F1F] pt-3">
                      <p className="text-[10px] uppercase tracking-wider text-[#5A5A5A]">
                        {t("studio.yourEpisodes")}
                      </p>
                      {episodes.map((ep) => (
                        <div key={ep.id} className="text-xs text-[#8A8A8A] py-1 border-b border-[#1F1F1F]">
                          <span className="text-[#F5F5F5]">{ep.title}</span>
                          {ep.published_at && (
                            <span className="text-[#5A5A5A] ml-2">· live</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Panel>
            ) : mode === "ai_video" ? (
              <Panel open title={t("studio.talkingAvatar")} subtitle={t("studio.talkingAvatarSubtitle")}>
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
                      {t("studio.uploadPhoto")}
                    </Button>
                    <Button className="flex-1" variant="secondary" onClick={startCamera}>
                      {t("studio.capture")}
                    </Button>
                    <Button className="flex-1" onClick={capture}>
                      {t("studio.useFrame")}
                    </Button>
                  </div>
                  <Input
                    label={t("studio.scriptLabel")}
                    value={aiScript}
                    onChange={(e) => setAiScript(e.target.value)}
                    placeholder="Hi, I'm here while favl is busy..."
                  />
                  <Button className="w-full" loading={loading} disabled={!avatarPhoto || !aiScript.trim()} onClick={generateAiVideo}>
                    {t("studio.generateTalkingVideo")}
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
                      {canHideAiTag ? t("studio.hideAiTag") : t("studio.aiTagShownUpgrade")}
                    </label>
                  )}
                  <Button className="w-full" loading={loading} disabled={!preview} onClick={publish}>
                    {t("studio.publishAiVideo")}
                  </Button>
                </div>
              </Panel>
            ) : (
              <Panel open title={t("studio.cameraFilters")}>
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
                    {visibleFilters.map((f) => (
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
                    label={mode === "reel" ? t("studio.uploadReel") : t("studio.uploadPhotoMedia")}
                    previewUrl={uploadedMedia?.url}
                    onUploaded={(m) => {
                      setUploadedMedia(m);
                      setPreview(null);
                    }}
                    onClear={() => setUploadedMedia(null)}
                    compact
                  />
                  <Button className="w-full" variant="secondary" onClick={startCamera}>
                    {t("studio.startCamera")}
                  </Button>
                  <Button className="w-full" onClick={capture}>
                    {mode === "reel" ? t("studio.captureFrame") : t("studio.capturePhoto")}
                  </Button>
                  <Input label={t("studio.caption")} value={caption} onChange={(e) => setCaption(e.target.value)} />
                  <Button className="w-full" variant="secondary" disabled={!caption.trim()} onClick={handleAiCaption}>
                    {t("studio.polishCaption")}
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
                      {canHideAiTag ? t("studio.hideAiTag") : t("studio.aiTagShown")}
                    </label>
                  )}
                  <Button className="w-full" loading={loading} disabled={!preview && !uploadedMedia} onClick={publish}>
                    {t("studio.publishMode", { mode })}
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