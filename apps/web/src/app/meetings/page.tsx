"use client";

import { useState } from "react";
import { Button, FadeIn, Input, Panel, AnimatedList, AnimatedListItem } from "@nexus/ui";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useCreateMeeting, useMeetings, useUpcomingMeetings } from "@/hooks/queries/useMeetings";
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
  const token = session?.accessToken;
  const { data: mine = [], isLoading: loadingMine } = useMeetings(token);
  const { data: upcoming = [], isLoading: loadingUpcoming } = useUpcomingMeetings(token);
  const createMeeting = useCreateMeeting(token);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");

  async function handleCreate() {
    if (!title.trim() || !when) return;
    await createMeeting.mutateAsync({
      title: title.trim(),
      scheduled_at: new Date(when).toISOString(),
      duration_min: 30,
    });
    setTitle("");
    setWhen("");
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <FadeIn className="mx-auto max-w-lg space-y-5">
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
                  loading={createMeeting.isPending}
                  disabled={!title.trim() || !when}
                  onClick={handleCreate}
                >
                  Schedule
                </Button>
              </div>
            </Panel>

            <Panel open title="Upcoming">
              {loadingUpcoming ? (
                <p className="text-xs text-[#5A5A5A]">Loading…</p>
              ) : upcoming.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">No upcoming meetings.</p>
              ) : (
                <AnimatedList className="space-y-2">
                  {upcoming.map((m) => (
                    <AnimatedListItem key={m.id}>
                      <MeetingRow meeting={m} />
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              )}
            </Panel>

            <Panel open title="Your meetings">
              {loadingMine ? (
                <p className="text-xs text-[#5A5A5A]">Loading…</p>
              ) : mine.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">You have not hosted any meetings yet.</p>
              ) : (
                <AnimatedList className="space-y-2">
                  {mine.map((m) => (
                    <AnimatedListItem key={m.id}>
                      <MeetingRow meeting={m} />
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              )}
            </Panel>
          </FadeIn>
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