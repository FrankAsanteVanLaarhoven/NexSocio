"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Panel } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { getInbox, markNotificationRead } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import type { Notification } from "@nexus/types";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function InboxPage() {
  const session = useAuthStore((s) => s.session);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const inbox = await getInbox(session.accessToken);
      setNotifications(inbox.notifications);
      setUnread(inbox.unread_count);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  useNotificationSocket(session?.accessToken, (n) => {
    setNotifications((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
    setUnread((c) => c + (n.read ? 0 : 1));
  });

  async function handleOpen(n: Notification) {
    if (!session || n.read) return;
    try {
      const updated = await markNotificationRead(session.accessToken, n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? updated : x))
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/settings" className="text-xs text-[#8A8A8A] hover:text-[#00E5FF]">
                  ← Settings
                </Link>
                <h1 className="text-xl font-semibold text-[#F5F5F5] mt-2">Inbox</h1>
              </div>
              {unread > 0 && (
                <span className="text-[10px] text-[#FF5252]">{unread} new</span>
              )}
            </div>
            <Panel open title="Notifications">
              {loading ? (
                <p className="text-xs text-[#5A5A5A]">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleOpen(n)}
                    className={`w-full text-left py-3 border-b border-[#1F1F1F] ${
                      n.read ? "opacity-70" : "opacity-100"
                    }`}
                  >
                    <div className="flex justify-between">
                      <span
                        className={`text-sm ${
                          n.read ? "text-[#8A8A8A]" : "text-[#F5F5F5] font-medium"
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="text-[10px] text-[#5A5A5A]">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-[#5A5A5A] mt-0.5 truncate">{n.body || n.type}</p>
                  </button>
                ))
              )}
            </Panel>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}