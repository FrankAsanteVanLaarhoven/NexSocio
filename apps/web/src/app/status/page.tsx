"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { getMyStatus, getStatusFeed, postStatus } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { StatusUpdate } from "@nexus/types";

function timeLeft(expires: string) {
  const ms = new Date(expires).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function StatusPage() {
  const session = useAuthStore((s) => s.session);
  const [feed, setFeed] = useState<StatusUpdate[]>([]);
  const [mine, setMine] = useState<StatusUpdate | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [updates, myStatus] = await Promise.all([
        getStatusFeed(session.accessToken),
        getMyStatus(session.accessToken),
      ]);
      setFeed(updates);
      setMine(myStatus);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePost() {
    if (!session || !text.trim()) return;
    setPosting(true);
    try {
      await postStatus(session.accessToken, { text: text.trim() });
      setText("");
      await load();
    } finally {
      setPosting(false);
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
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Status</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">24-hour updates · WhatsApp-style</p>
            </div>

            {mine && (
              <Panel open title="Your status">
                <p className="text-sm text-[#F5F5F5]">{mine.text || "Media status"}</p>
                <p className="text-[10px] text-[#5A5A5A] mt-1">{timeLeft(mine.expires_at)}</p>
              </Panel>
            )}

            <Panel open title="Post status">
              <div className="space-y-3">
                <Input
                  label="What's happening?"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Available for calls…"
                />
                <Button
                  className="w-full"
                  loading={posting}
                  disabled={!text.trim()}
                  onClick={handlePost}
                >
                  Share for 24h
                </Button>
              </div>
            </Panel>

            <Panel open title="Feed">
              {loading ? (
                <p className="text-xs text-[#5A5A5A]">Loading…</p>
              ) : feed.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">No active statuses.</p>
              ) : (
                <div className="space-y-3">
                  {feed.map((s) => (
                    <div key={s.id} className="rounded-lg border border-[#2A2A2A] p-3">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-[#F5F5F5] font-medium">{s.display_name}</p>
                        <span className="text-[10px] text-[#5A5A5A]">{timeLeft(s.expires_at)}</span>
                      </div>
                      {s.text && <p className="text-xs text-[#8A8A8A] mt-1">{s.text}</p>}
                      {s.media_url && (
                        <p className="text-[10px] text-[#00E5FF] mt-1 truncate">{s.media_url}</p>
                      )}
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