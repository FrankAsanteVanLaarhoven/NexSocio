"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AnimatedList, AnimatedListItem, FadeIn, Panel, PulseBadge } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { InboxControlsPanel } from "@/components/inbox/InboxControlsPanel";
import { InboxLibraryPanel } from "@/components/inbox/InboxLibraryPanel";
import { InboxPeopleRow } from "@/components/inbox/InboxPeopleRow";
import { AppIcon } from "@/components/icons/AppIcon";
import { useInbox, useMarkNotificationRead } from "@/hooks/queries/useInbox";
import { PushEnableBanner } from "@/components/PushEnableBanner";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { useAuthStore } from "@/lib/auth-store";
import { useInboxStore } from "@/lib/inbox-store";
import { useTranslation } from "@/i18n";
import type { Notification } from "@nexus/types";

type InboxTab = "activity" | "people" | "library" | "controls";

export default function InboxPage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const { data, isLoading } = useInbox(token);
  const markRead = useMarkNotificationRead(token);
  const { archivedIds, spamIds, blockUser, archiveNotification, markSpam, pushUndo } = useInboxStore();
  const [tab, setTab] = useState<InboxTab>("activity");
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  useNotificationSocket(token);

  const notifications = (data?.notifications ?? []).filter(
    (n) => !archivedIds.includes(n.id) && !spamIds.includes(n.id)
  );
  const unread = data?.unread_count ?? 0;

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return t("common.now");
    if (m < 60) return t("common.minutesAgo", { m });
    const h = Math.floor(m / 60);
    if (h < 24) return t("common.hoursAgo", { h });
    return t("common.daysAgo", { d: Math.floor(h / 24) });
  }

  async function handleOpen(n: Notification) {
    if (!token || n.read || markRead.isPending) return;
    markRead.mutate(n.id);
  }

  function handleArchive(n: Notification) {
    pushUndo("archive", { id: n.id });
    archiveNotification(n.id);
    setActionMenu(null);
  }

  function handleSpam(n: Notification) {
    pushUndo("spam", { id: n.id });
    markSpam(n.id);
    setActionMenu(null);
  }

  function handleBlock(n: Notification) {
    if (n.user_id) {
      pushUndo("block", { userId: n.user_id });
      blockUser(n.user_id);
    }
    setActionMenu(null);
  }

  const TABS: { id: InboxTab; labelKey: string; icon: "mail" | "friends" | "star" | "settings" }[] = [
    { id: "activity", labelKey: "inbox.tabActivity", icon: "mail" },
    { id: "people", labelKey: "inbox.tabPeople", icon: "friends" },
    { id: "library", labelKey: "inbox.tabLibrary", icon: "star" },
    { id: "controls", labelKey: "inbox.tabControls", icon: "settings" },
  ];

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <FadeIn className="mx-auto max-w-lg space-y-5 pb-12">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/settings" className="text-xs text-muted hover:text-accent">
                  {t("common.backToSettings")}
                </Link>
                <h1 className="text-xl font-semibold text-primary mt-2">{t("inbox.title")}</h1>
                <p className="text-xs text-dim mt-0.5">{t("inbox.subtitle")}</p>
              </div>
              {unread > 0 && (
                <PulseBadge className="text-[10px] text-danger">{t("inbox.newCount", { n: unread })}</PulseBadge>
              )}
            </div>

            {token && <PushEnableBanner token={token} />}

            <div className="flex gap-1 p-1 rounded-lg border border-subtle bg-base">
              {TABS.map((tb) => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setTab(tb.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-md text-[9px] uppercase tracking-wider transition-colors ${
                    tab === tb.id ? "bg-accent-muted text-accent" : "text-dim hover:text-muted"
                  }`}
                >
                  <AppIcon name={tb.icon} size={14} />
                  {t(tb.labelKey)}
                </button>
              ))}
            </div>

            {tab === "activity" && (
              <Panel open title={t("inbox.activityHistory")}>
                {isLoading ? (
                  <p className="text-xs text-dim">{t("common.loading")}</p>
                ) : notifications.length === 0 ? (
                  <p className="text-xs text-dim">{t("inbox.empty")}</p>
                ) : (
                  <AnimatedList>
                    <AnimatePresence initial={false}>
                      {notifications.map((n) => (
                        <AnimatedListItem key={n.id}>
                          <div className="relative py-3 border-b border-subtle">
                            <button
                              type="button"
                              onClick={() => handleOpen(n)}
                              className={`w-full text-left pr-8 transition-opacity ${
                                n.read ? "opacity-70" : "opacity-100"
                              }`}
                            >
                              <div className="flex justify-between gap-2">
                                <span
                                  className={`text-sm ${
                                    n.read ? "text-muted" : "text-primary font-medium"
                                  }`}
                                >
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-dim shrink-0">{timeAgo(n.created_at)}</span>
                              </div>
                              <p className="text-xs text-dim mt-0.5">{n.body || n.type}</p>
                              <span className="inline-block mt-1 text-[9px] uppercase tracking-wider text-accent/80">
                                {n.type}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActionMenu(actionMenu === n.id ? null : n.id)}
                              className="absolute right-0 top-3 text-dim hover:text-accent p-1"
                              aria-label={t("inbox.moreActions")}
                            >
                              ⋯
                            </button>
                            {actionMenu === n.id && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {(
                                  [
                                    ["archive", handleArchive, "inbox.controls.archives"],
                                    ["spam", handleSpam, "inbox.controls.spam"],
                                    ["block", handleBlock, "inbox.controls.block"],
                                  ] as const
                                ).map(([key, fn, labelKey]) => (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => fn(n)}
                                    className="text-[10px] px-2 py-1 rounded border border-default text-muted hover:text-accent hover:border-accent"
                                  >
                                    {t(labelKey)}
                                  </button>
                                ))}
                                <Link
                                  href="/safety"
                                  className="text-[10px] px-2 py-1 rounded border border-default text-muted hover:text-danger hover:border-danger"
                                >
                                  {t("inbox.controls.report")}
                                </Link>
                              </div>
                            )}
                          </div>
                        </AnimatedListItem>
                      ))}
                    </AnimatePresence>
                  </AnimatedList>
                )}
              </Panel>
            )}

            {tab === "people" && token && (
              <Panel open title={t("inbox.tabPeople")}>
                <InboxPeopleRow token={token} />
              </Panel>
            )}

            {tab === "library" && <InboxLibraryPanel />}

            {tab === "controls" && <InboxControlsPanel />}
          </FadeIn>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}