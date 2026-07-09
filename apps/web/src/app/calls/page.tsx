"use client";

import { Button, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import {
  answerCall,
  endCall,
  getRecentCalls,
  listContacts,
  startCall,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { CallSession, Contact } from "@nexus/types";

export default function CallsPage() {
  const session = useAuthStore((s) => s.session);
  const [calls, setCalls] = useState<CallSession[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [callType, setCallType] = useState<"voice" | "video">("voice");
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [recent, contactList] = await Promise.all([
        getRecentCalls(session.accessToken),
        listContacts(session.accessToken),
      ]);
      setCalls(recent);
      setContacts(contactList.filter((c) => c.contact_user_id));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStart() {
    if (!session || !selected) return;
    const contact = contacts.find((c) => c.id === selected);
    if (!contact?.contact_user_id) return;
    setCalling(true);
    try {
      const call = await startCall(session.accessToken, {
        callee_id: contact.contact_user_id,
        callee_name: contact.display_name,
        call_type: callType,
      });
      setActiveCall(call);
      await load();
    } finally {
      setCalling(false);
    }
  }

  async function handleAnswer(callId: string) {
    if (!session) return;
    const call = await answerCall(session.accessToken, callId);
    setActiveCall(call);
    await load();
  }

  async function handleEnd(callId: string) {
    if (!session) return;
    await endCall(session.accessToken, callId);
    setActiveCall(null);
    await load();
  }

  const ringing = calls.find(
    (c) => c.status === "ringing" && c.callee_id === session?.userId
  );

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-5">
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Calls</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">WhatsApp-style voice & video</p>
            </div>

            {ringing && (
              <Panel open title="Incoming call">
                <p className="text-sm text-[#F5F5F5]">
                  {ringing.caller_name} · {ringing.call_type}
                </p>
                <p className="text-xs text-[#00E5FF] font-mono mt-1">Room {ringing.room_code}</p>
                <div className="flex gap-2 mt-3">
                  <Button className="flex-1" onClick={() => handleAnswer(ringing.id)}>
                    Answer
                  </Button>
                  <Button className="flex-1" variant="secondary" onClick={() => handleEnd(ringing.id)}>
                    Decline
                  </Button>
                </div>
              </Panel>
            )}

            {activeCall && activeCall.status === "active" && (
              <Panel open title="Active call">
                <p className="text-sm text-[#00C853]">
                  Connected · Room {activeCall.room_code}
                </p>
                <p className="text-xs text-[#5A5A5A] mt-1">
                  Use the room code in your WebRTC client or share with participants.
                </p>
                <Button className="w-full mt-3" variant="secondary" onClick={() => handleEnd(activeCall.id)}>
                  End call
                </Button>
              </Panel>
            )}

            <Panel open title="New call">
              <div className="space-y-3">
                <label className="block text-xs text-[#8A8A8A]">Contact</label>
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full rounded-md border border-[#2A2A2A] bg-[#111] px-3 py-2 text-sm text-[#F5F5F5]"
                >
                  <option value="">Select contact</option>
                  {contacts.map((c) => (
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
                  loading={calling}
                  disabled={!selected}
                  onClick={handleStart}
                >
                  Call
                </Button>
              </div>
            </Panel>

            <Panel open title="Recent calls">
              {loading ? (
                <p className="text-xs text-[#5A5A5A]">Loading…</p>
              ) : calls.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">No calls yet.</p>
              ) : (
                <div className="space-y-2">
                  {calls.map((c) => (
                    <div key={c.id} className="flex justify-between items-center py-2 border-b border-[#1F1F1F]">
                      <div>
                        <p className="text-sm text-[#F5F5F5]">
                          {c.caller_id === session.userId ? c.callee_name : c.caller_name}
                        </p>
                        <p className="text-[10px] text-[#5A5A5A]">
                          {c.call_type} · {c.status}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-[#00E5FF]">{c.room_code}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}