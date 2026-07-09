"use client";

import { Button, Input, Panel } from "@nexus/ui";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { createMeeting, listMeetings, listUpcomingMeetings } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Meeting } from "@nexus/types";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MeetingsPage() {
  const session = useAuthStore((s) => s.session);
  const [mine, setMine] = useState<Meeting[]>([]);
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [myMeetings, allUpcoming] = await Promise.all([
        listMeetings(session.accessToken),
        listUpcomingMeetings(session.accessToken),
      ]);
      setMine(myMeetings);
      setUpcoming(allUpcoming);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!session || !title.trim() || !when) return;
    setCreating(true);
    try {
      await createMeeting(session.accessToken, {
        title: title.trim(),
        scheduled_at: new Date(when).toISOString(),
        duration_min: 30,
      });
      setTitle("");
      setWhen("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-5">
            <div>
              <Link href="/teams" className="text-xs text-[#8A8A8A] hover:text-[#00E5FF]">
                ← Teams
              </Link>
              <h1 className="text-xl font-semibold text-[#F5F5F5] mt-2">Meetings</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">Schedule · join with room code</p>
            </div>

            <Panel open title="Schedule meeting">
              <div className="space-y-3">
                <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Input
                  label="Date & time"
                  type="datetime-local"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                />
                <Button
                  className="w-full"
                  loading={creating}
                  disabled={!title.trim() || !when}
                  onClick={handleCreate}
                >
                  Schedule
                </Button>
              </div>
            </Panel>

            <Panel open title="Upcoming">
              {loading ? (
                <p className="text-xs text-[#5A5A5A]">Loading…</p>
              ) : upcoming.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">No upcoming meetings.</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((m) => (
                    <MeetingRow key={m.id} meeting={m} />
                  ))}
                </div>
              )}
            </Panel>

            <Panel open title="Your meetings">
              {mine.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">You have not hosted any meetings yet.</p>
              ) : (
                <div className="space-y-2">
                  {mine.map((m) => (
                    <MeetingRow key={m.id} meeting={m} />
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

function MeetingRow({ meeting }: { meeting: Meeting }) {
  return (
    <div className="rounded-lg border border-[#2A2A2A] p-3">
      <p className="text-sm text-[#F5F5F5] font-medium">{meeting.title}</p>
      <p className="text-[10px] text-[#5A5A5A] mt-0.5">
        {formatWhen(meeting.scheduled_at)} · {meeting.duration_min}m · host {meeting.host_name}
      </p>
      <p className="text-xs text-[#00E5FF] mt-1 font-mono">Room {meeting.room_code}</p>
    </div>
  );
}