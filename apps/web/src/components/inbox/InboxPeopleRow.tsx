"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppIcon } from "@/components/icons/AppIcon";
import { useTranslation } from "@/i18n";
import { getConnections, getStatusFeed } from "@/lib/api";
import { useInboxStore } from "@/lib/inbox-store";
import type { Connection, StatusUpdate } from "@nexus/types";

function Avatar({ name, online, hasStatus }: { name: string; online?: boolean; hasStatus?: boolean }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="relative shrink-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-accent bg-accent-muted text-sm font-medium text-accent">
        {initial}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--color-base)] bg-success" />
      )}
      {hasStatus && !online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--color-base)] bg-accent" />
      )}
    </div>
  );
}

export function InboxPeopleRow({ token }: { token: string }) {
  const { t } = useTranslation();
  const { recentlyViewed, favoriteFollows } = useInboxStore();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [statusFeed, setStatusFeed] = useState<StatusUpdate[]>([]);

  useEffect(() => {
    getConnections(token).then((d) => setConnections(d.connections)).catch(() => {});
    getStatusFeed(token).then(setStatusFeed).catch(() => {});
  }, [token]);

  const statusUserIds = useMemo(() => new Set(statusFeed.map((s) => s.user_id)), [statusFeed]);

  const online = useMemo(() => {
    return connections
      .filter((c) => statusUserIds.has(c.other_user_id))
      .slice(0, 12)
      .map((c) => ({
        userId: c.other_user_id,
        name: c.other_display_name || t("connections.connectedUser"),
        online: true,
        hasStatus: true,
      }));
  }, [connections, statusUserIds, t]);

  const offline = useMemo(() => {
    return connections
      .filter((c) => !statusUserIds.has(c.other_user_id))
      .slice(0, 8)
      .map((c) => ({
        userId: c.other_user_id,
        name: c.other_display_name || t("connections.connectedUser"),
        online: false,
      }));
  }, [connections, statusUserIds, t]);

  const favorites = favoriteFollows.length > 0 ? favoriteFollows : online.slice(0, 6).map((p) => ({
    userId: p.userId,
    displayName: p.name,
    hasStatus: p.hasStatus,
  }));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-dim mb-2">{t("inbox.onlineNow")}</p>
        {online.length === 0 ? (
          <p className="text-xs text-dim">{t("inbox.noOneOnline")}</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {online.map((p) => (
              <Link key={p.userId} href={`/connections`} className="flex flex-col items-center gap-1 min-w-[52px]">
                <Avatar name={p.name} online />
                <span className="text-[9px] text-muted truncate max-w-[52px]">{p.name.split(" ")[0]}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {offline.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-dim mb-2">{t("inbox.recentlyActive")}</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {offline.map((p) => (
              <Link key={p.userId} href="/connections" className="flex flex-col items-center gap-1 min-w-[52px] opacity-70">
                <Avatar name={p.name} />
                <span className="text-[9px] text-dim truncate max-w-[52px]">{p.name.split(" ")[0]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {favorites.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-dim mb-2">{t("inbox.favoriteFollows")}</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {favorites.map((f) => (
              <Link key={f.userId} href="/connections" className="flex flex-col items-center gap-1 min-w-[52px]">
                <Avatar name={f.displayName} hasStatus={f.hasStatus} />
                <span className="text-[9px] text-muted truncate max-w-[52px]">{f.displayName.split(" ")[0]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {recentlyViewed.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-dim mb-2">{t("inbox.recentlyViewed")}</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {recentlyViewed.slice(0, 10).map((p) => (
              <Link key={p.userId} href="/profile" className="flex flex-col items-center gap-1 min-w-[52px]">
                <Avatar name={p.displayName} />
                <span className="text-[9px] text-dim truncate max-w-[52px]">{p.displayName.split(" ")[0]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}