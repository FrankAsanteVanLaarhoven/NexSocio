"use client";

import { useState } from "react";
import { Button, FadeIn, Panel } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { CallView } from "@/components/CallView";
import {
  useAnswerCall,
  useEndCall,
  useRecentCalls,
  useStartCall,
} from "@/hooks/queries/useCalls";
import { useContacts } from "@/hooks/queries/useContacts";
import { useActiveCallSync } from "@/hooks/useActiveCallSync";
import { useAuthStore } from "@/lib/auth-store";
import type { CallSession } from "@nexus/types";

export default function CallsPage() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const userId = session?.userId ?? "";

  const { data: calls = [], isLoading } = useRecentCalls(token);
  const { data: contacts = [] } = useContacts(token, true);
  const startCall = useStartCall(token);
  const answerCall = useAnswerCall(token);
  const endCall = useEndCall(token);

  const [selected, setSelected] = useState("");
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [callRole, setCallRole] = useState<"caller" | "callee">("caller");

  const callableContacts = contacts.filter((c) => c.contact_user_id);

  useActiveCallSync(calls, activeCall, setActiveCall);

  const ringing = calls.find(
    (c) => c.status === "ringing" && c.callee_id === userId
  );

  async function handleStart() {
    const contact = callableContacts.find((c) => c.id === selected);
    if (!contact?.contact_user_id) return;
    const call = await startCall.mutateAsync({
      callee_id: contact.contact_user_id,
      callee_name: contact.display_name,
      call_type: callType,
    });
    setActiveCall(call);
    setCallRole("caller");
  }

  async function handleAnswer(call: CallSession) {
    const updated = await answerCall.mutateAsync(call.id);
    setActiveCall(updated);
    setCallRole("callee");
  }

  async function handleEnd(callId: string) {
    await endCall.mutateAsync(callId);
    setActiveCall(null);
  }

  function handleCallEnded() {
    if (activeCall) {
      endCall.mutate(activeCall.id);
    }
    setActiveCall(null);
  }

  const showMedia =
    activeCall &&
    (activeCall.status === "active" ||
      (callRole === "caller" && activeCall.status === "ringing"));

  const peerName = activeCall
    ? activeCall.caller_id === userId
      ? activeCall.callee_name
      : activeCall.caller_name
    : "";

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <FadeIn className="mx-auto max-w-lg space-y-5">
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Calls</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">
                Real WebRTC voice & video
              </p>
            </div>

            {ringing && !activeCall && (
              <Panel open title="Incoming call">
                <p className="text-sm text-[#F5F5F5]">
                  {ringing.caller_name} · {ringing.call_type}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button className="flex-1" onClick={() => handleAnswer(ringing)}>
                    Answer
                  </Button>
                  <Button
                    className="flex-1"
                    variant="secondary"
                    onClick={() => handleEnd(ringing.id)}
                  >
                    Decline
                  </Button>
                </div>
              </Panel>
            )}

            {showMedia && activeCall && (
              <CallView
                token={token!}
                userId={userId}
                call={activeCall}
                role={callRole}
                peerName={peerName}
                onEnd={handleCallEnded}
              />
            )}

            {!showMedia && (
              <Panel open title="New call">
                <div className="space-y-3">
                  <label className="block text-xs text-[#8A8A8A]">Contact</label>
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    className="w-full rounded-md border border-[#2A2A2A] bg-[#111] px-3 py-2 text-sm text-[#F5F5F5]"
                  >
                    <option value="">Select contact</option>
                    {callableContacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.display_name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    {(["voice", "video"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCallType(t)}
                        className={`flex-1 py-2 text-xs uppercase tracking-wider rounded-md border ${
                          callType === t
                            ? "border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]"
                            : "border-[#2A2A2A] text-[#8A8A8A]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    loading={startCall.isPending}
                    disabled={!selected}
                    onClick={handleStart}
                  >
                    Call
                  </Button>
                </div>
              </Panel>
            )}

            <Panel open title="Recent calls">
              {isLoading ? (
                <p className="text-xs text-[#5A5A5A]">Loading…</p>
              ) : calls.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">No calls yet.</p>
              ) : (
                <div className="space-y-2">
                  {calls.map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between items-center py-2 border-b border-[#1F1F1F]"
                    >
                      <div>
                        <p className="text-sm text-[#F5F5F5]">
                          {c.caller_id === userId ? c.callee_name : c.caller_name}
                        </p>
                        <p className="text-[10px] text-[#5A5A5A]">
                          {c.call_type} · {c.status}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-[#00E5FF]">
                        {c.room_code}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </FadeIn>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}