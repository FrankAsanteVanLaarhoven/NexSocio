"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import type { DigitalTwin, TwinBriefing } from "@nexus/types";
import {
  activateTwin,
  createRobotTwin,
  deactivateTwin,
  generateTwinAvatarVideo,
  getMe,
  getRobotDashboard,
  getTwinBriefing,
  sendTwinMessage,
  twinPost,
  twinVideoPost,
  uploadTwinAvatar,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { readFileAsDataUrl, renderTalkingAvatar } from "@/lib/talking-avatar";

export default function TwinPage() {
  const session = useAuthStore((s) => s.session);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [twins, setTwins] = useState<DigitalTwin[]>([]);
  const [active, setActive] = useState<DigitalTwin | null>(null);
  const [briefing, setBriefing] = useState<TwinBriefing | null>(null);
  const [name, setName] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [postBody, setPostBody] = useState("");
  const [avatarScript, setAvatarScript] = useState("");
  const [avatarVideo, setAvatarVideo] = useState<string | null>(null);
  const [canHideAiTag, setCanHideAiTag] = useState(false);
  const [hideAiTag, setHideAiTag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [dash, me] = await Promise.all([
        getRobotDashboard(session.accessToken),
        getMe(session.accessToken),
      ]);
      setTwins(dash.twins);
      setActive(dash.active_twin ?? dash.twins.find((t) => t.is_active) ?? null);
      setCanHideAiTag(!!me.can_hide_ai_tag);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!session || !name.trim()) return;
    await createRobotTwin(session.accessToken, name.trim(), session.displayName);
    setName("");
    await load();
  }

  async function handleActivate(twin: DigitalTwin) {
    if (!session) return;
    await activateTwin(session.accessToken, twin.agent_id, session.displayName);
    await load();
  }

  async function handleDeactivate(twin: DigitalTwin) {
    if (!session) return;
    await deactivateTwin(session.accessToken, twin.agent_id);
    setBriefing(null);
    await load();
  }

  async function handleBriefing(twin: DigitalTwin) {
    if (!session) return;
    const b = await getTwinBriefing(session.accessToken, twin.agent_id);
    setBriefing(b);
    if ("speechSynthesis" in window) {
      speechSynthesis.speak(new SpeechSynthesisUtterance(b.voice_summary));
    }
  }

  async function handleTwinPost(twin: DigitalTwin) {
    if (!session || !postBody.trim()) return;
    await twinPost(session.accessToken, twin.agent_id, postBody.trim());
    setPostBody("");
    await load();
  }

  async function handleTestMessage(twin: DigitalTwin) {
    if (!session || !msgBody.trim()) return;
    await sendTwinMessage(session.accessToken, twin.agent_id, "Visitor", msgBody.trim());
    setMsgBody("");
  }

  async function handleAvatarUpload(twin: DigitalTwin, file: File) {
    if (!session) return;
    setBusy(true);
    try {
      const data = await readFileAsDataUrl(file);
      await uploadTwinAvatar(session.accessToken, twin.agent_id, data);
      setStatus("Avatar photo saved — ready for talking-head video.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function captureAvatar(twin: DigitalTwin) {
    if (!session || !videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 720;
    canvas.height = videoRef.current.videoHeight || 1280;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const data = canvas.toDataURL("image/jpeg", 0.9);
    setBusy(true);
    try {
      await uploadTwinAvatar(session.accessToken, twin.agent_id, data);
      setStatus("Avatar captured from camera.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function startAvatarCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }

  async function handleGenerateVideo(twin: DigitalTwin) {
    if (!session || !avatarScript.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      const job = await generateTwinAvatarVideo(
        session.accessToken,
        twin.agent_id,
        avatarScript.trim()
      );

      if (job.video_url) {
        setAvatarVideo(job.video_url);
        setStatus(`D-ID video ready (${job.provider})`);
        return;
      }

      const image = twin.avatar_image;
      if (!image) {
        setStatus("Upload your photo first.");
        return;
      }

      const local = await renderTalkingAvatar(image, avatarScript.trim());
      setAvatarVideo(local.videoDataUrl);
      setStatus("Talking avatar rendered on device — lip-sync ready.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Video generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function handlePublishVideo(twin: DigitalTwin) {
    if (!session || !avatarVideo || !avatarScript.trim()) return;
    setBusy(true);
    try {
      await twinVideoPost(session.accessToken, twin.agent_id, {
        script: avatarScript.trim(),
        video_url: avatarVideo,
        context: session.viewContext ?? "personal",
        ai_assisted: true,
        hide_ai_tag: canHideAiTag && hideAiTag,
      });
      setStatus("AI talking video posted to feed.");
      setAvatarVideo(null);
      setAvatarScript("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Digital Twin</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">
                Talking avatar · represent you when busy · post · voice debrief
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
              </div>
            ) : (
              <>
                <Panel open title="Create Your Twin">
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Twin name e.g. Ava Assistant"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Button onClick={handleCreate}>Create</Button>
                  </div>
                </Panel>

                {twins.map((twin) => (
                  <Panel
                    key={twin.agent_id}
                    open
                    title={twin.name}
                    subtitle={`${twin.agent_id} · ${twin.status}`}
                    className={twin.is_active ? "border-[#00E5FF]/40" : undefined}
                  >
                    <div className="space-y-4">
                      {twin.persona_greeting && (
                        <p className="text-xs text-[#8A8A8A] italic leading-relaxed border-l-2 border-[#00E5FF]/30 pl-3">
                          {twin.persona_greeting}
                        </p>
                      )}

                      <Panel open title="Talking Avatar" subtitle="Upload photo → speech-driven lip sync">
                        <div className="space-y-3">
                          <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleAvatarUpload(twin, f);
                            }}
                          />
                          <div className="flex gap-3 items-start">
                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[#2A2A2A] bg-black">
                              {twin.avatar_image ? (
                                <img src={twin.avatar_image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                                Upload Photo
                              </Button>
                              <Button size="sm" variant="secondary" onClick={startAvatarCamera}>
                                Camera
                              </Button>
                              <Button size="sm" onClick={() => captureAvatar(twin)}>
                                Save Frame
                              </Button>
                            </div>
                          </div>
                          <Input
                            label="What your twin says on video"
                            value={avatarScript}
                            onChange={(e) => setAvatarScript(e.target.value)}
                            placeholder={`Hi — I'm the digital twin of ${session.displayName}...`}
                          />
                          <Button
                            size="sm"
                            className="w-full"
                            loading={busy}
                            disabled={!avatarScript.trim() || !twin.avatar_image}
                            onClick={() => handleGenerateVideo(twin)}
                          >
                            Generate Talking Video
                          </Button>
                          {avatarVideo && (
                            <video
                              src={avatarVideo}
                              controls
                              playsInline
                              className="w-full rounded-lg border border-[#2A2A2A] max-h-64"
                            />
                          )}
                          <label className="flex items-center gap-2 text-xs text-[#8A8A8A]">
                            <input
                              type="checkbox"
                              checked={hideAiTag}
                              disabled={!canHideAiTag}
                              onChange={(e) => setHideAiTag(e.target.checked)}
                              className="accent-[#7C4DFF]"
                            />
                            {canHideAiTag ? "Hide NEXSOCIO AI tag on video post" : "NEXSOCIO AI tag shown on video"}
                          </label>
                          <Button
                            size="sm"
                            className="w-full"
                            loading={busy}
                            disabled={!avatarVideo}
                            onClick={() => handlePublishVideo(twin)}
                          >
                            Post AI Video to Feed
                          </Button>
                        </div>
                      </Panel>

                      <div className="flex flex-wrap gap-2">
                        {!twin.is_active ? (
                          <Button size="sm" onClick={() => handleActivate(twin)}>
                            I&apos;m Busy — Activate
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => handleDeactivate(twin)}>
                              I&apos;m Back — Deactivate
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleBriefing(twin)}>
                              Voice Debrief
                            </Button>
                          </>
                        )}
                      </div>
                      {twin.is_active && (
                        <>
                          <Input
                            label="Post as twin"
                            value={postBody}
                            onChange={(e) => setPostBody(e.target.value)}
                            placeholder="Share an update while you're away..."
                          />
                          <Button size="sm" className="w-full" onClick={() => handleTwinPost(twin)}>
                            Publish Twin Post
                          </Button>
                          <Input
                            label="Simulate visitor message"
                            value={msgBody}
                            onChange={(e) => setMsgBody(e.target.value)}
                            placeholder="Hi, is favl available?"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full"
                            onClick={() => handleTestMessage(twin)}
                          >
                            Send Test Message
                          </Button>
                        </>
                      )}
                    </div>
                  </Panel>
                ))}

                {status && (
                  <p className="text-xs text-[#00C853] text-center">{status}</p>
                )}

                {briefing && (
                  <Panel open title="While You Were Away" className="border-[#7C4DFF]/30">
                    <p className="text-sm text-[#F5F5F5] mb-4">{briefing.voice_summary}</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {briefing.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`text-xs rounded px-3 py-2 ${
                            m.direction === "inbound"
                              ? "bg-[#1A1A1A] text-[#D4D4D4]"
                              : "bg-[#00E5FF]/5 text-[#8A8A8A]"
                          }`}
                        >
                          <span className="text-[#5A5A5A]">{m.from_name}: </span>
                          {m.body}
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}

                {active && (
                  <div className="rounded-lg border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-4 py-3 text-center">
                    <p className="text-xs text-[#00E5FF]">
                      {active.name} is representing {active.owner_display_name || session.displayName}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}