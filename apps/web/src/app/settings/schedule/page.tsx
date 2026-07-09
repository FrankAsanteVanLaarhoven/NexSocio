"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useState } from "react";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";
import { useSettingsStore } from "@/lib/settings-store";

export default function ScheduleSettingsPage() {
  const { scheduledPosts, addScheduledPost } = useSettingsStore();
  const [body, setBody] = useState("");
  const [at, setAt] = useState("");

  return (
    <SettingsSectionShell section="schedule">
      <Panel open title="Schedule a post">
        <div className="space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Post content…"
            rows={3}
            className="w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
          />
          <Input type="datetime-local" label="Publish at" value={at} onChange={(e) => setAt(e.target.value)} />
          <Button
            size="sm"
            className="w-full"
            disabled={!body.trim() || !at}
            onClick={() => {
              addScheduledPost(body.trim(), at);
              setBody("");
              setAt("");
            }}
          >
            Schedule
          </Button>
        </div>
      </Panel>
      <Panel open title="Queued posts">
        {scheduledPosts.length === 0 ? (
          <p className="text-xs text-[#5A5A5A]">No scheduled posts</p>
        ) : (
          scheduledPosts.map((p) => (
            <div key={p.id} className="text-xs py-2 border-b border-[#1F1F1F]">
              <p className="text-[#F5F5F5]">{p.body}</p>
              <p className="text-[#5A5A5A]">{new Date(p.at).toLocaleString()}</p>
            </div>
          ))
        )}
      </Panel>
    </SettingsSectionShell>
  );
}