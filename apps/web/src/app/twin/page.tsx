"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import type { DigitalTwin, TwinBriefing } from "@nexus/types";
import {
  activateTwin,
  createRobotTwin,
  deactivateTwin,
  getRobotDashboard,
  getTwinBriefing,
  sendTwinMessage,
  twinPost,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function TwinPage() {
  const session = useAuthStore((s) => s.session);
  const [twins, setTwins] = useState<DigitalTwin[]>([]);
  const [active, setActive] = useState<DigitalTwin | null>(null);
  const [briefing, setBriefing] = useState<TwinBriefing | null>(null);
  const [name, setName] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [postBody, setPostBody] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const dash = await getRobotDashboard(session.accessToken);
      setTwins(dash.twins);
      setActive(dash.active_twin ?? dash.twins.find((t) => t.is_active) ?? null);
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
                Represent you when busy · post · receive messages · voice debrief
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
                          <Button size="sm" variant="secondary" className="w-full" onClick={() => handleTestMessage(twin)}>
                            Send Test Message
                          </Button>
                        </>
                      )}
                    </div>
                  </Panel>
                ))}

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