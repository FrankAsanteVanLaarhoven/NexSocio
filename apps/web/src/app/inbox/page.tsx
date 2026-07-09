"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { AnimatedList, AnimatedListItem, FadeIn, Panel, PulseBadge } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useInbox, useMarkNotificationRead } from "@/hooks/queries/useInbox";
import { PushEnableBanner } from "@/components/PushEnableBanner";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useAuthStore } from "@/lib/auth-store";
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
  const token = session?.accessToken;
  const { data, isLoading } = useInbox(token);
  const markRead = useMarkNotificationRead(token);

  useNotificationSocket(token);

  const notifications = data?.notifications ?? [];
  const unread = data?.unread_count ?? 0;

  async function handleOpen(n: Notification) {
    if (!token || n.read || markRead.isPending) return;
    markRead.mutate(n.id);
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <FadeIn className="mx-auto max-w-lg space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/settings" className="text-xs text-[#8A8A8A] hover:text-[#00E5FF]">
                  ← Settings
                </Link>
                <h1 className="text-xl font-semibold text-[#F5F5F5] mt-2">Inbox</h1>
              </div>
              {unread > 0 && (
                <PulseBadge className="text-[10px] text-[#FF5252]">{unread} new</PulseBadge>
              )}
            </div>
            {token && <PushEnableBanner token={token} />}

            <Panel open title="Notifications">
              {isLoading ? (
                <p className="text-xs text-[#5A5A5A]">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">No notifications yet.</p>
              ) : (
                <AnimatedList>
                  <AnimatePresence initial={false}>
                    {notifications.map((n) => (
                      <AnimatedListItem key={n.id}>
                        <button
                          type="button"
                          onClick={() => handleOpen(n)}
                          className={`w-full text-left py-3 border-b border-[#1F1F1F] transition-opacity ${
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
                          <p className="text-xs text-[#5A5A5A] mt-0.5 truncate">
                            {n.body || n.type}
                          </p>
                        </button>
                      </AnimatedListItem>
                    ))}
                  </AnimatePresence>
                </AnimatedList>
              )}
            </Panel>
          </FadeIn>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}