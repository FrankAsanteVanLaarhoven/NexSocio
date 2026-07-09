"use client";

import { Panel } from "@nexus/ui";
import { useTranslation } from "@/i18n";
import { useInboxStore } from "@/lib/inbox-store";

export function InboxLibraryPanel() {
  const { t } = useTranslation();
  const { likedVideos, favoriteSounds, collections, archivedIds } = useInboxStore();

  return (
    <div className="space-y-4">
      <div id="liked" />
      <Panel open title={t("inbox.controls.likedVideos")}>
        {likedVideos.length === 0 ? (
          <p className="text-xs text-dim">{t("inbox.likedEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {likedVideos.slice(0, 8).map((v) => (
              <div key={v.id} className="flex items-center gap-3 py-2 border-b border-subtle">
                <div className="h-10 w-10 rounded-md bg-accent-muted flex items-center justify-center text-accent text-xs">
                  ▶
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-primary truncate">{v.title}</p>
                  <p className="text-[10px] text-dim">{v.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div id="sounds" />
      <Panel open title={t("inbox.controls.favoriteSounds")}>
        {favoriteSounds.length === 0 ? (
          <p className="text-xs text-dim">{t("inbox.soundsEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {favoriteSounds.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center gap-3 py-2 border-b border-subtle">
                <div className="h-10 w-10 rounded-full bg-accent-muted flex items-center justify-center text-accent">
                  ♪
                </div>
                <p className="text-sm text-primary truncate">{s.title}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div id="collections" />
      <Panel open title={t("inbox.controls.collections")}>
        {collections.length === 0 ? (
          <p className="text-xs text-dim">{t("inbox.collectionsEmpty")}</p>
        ) : (
          collections.map((c) => (
            <p key={c.id} className="text-sm text-primary py-1">
              {c.name} · {c.itemIds.length}
            </p>
          ))
        )}
      </Panel>

      <div id="archives" />
      <Panel open title={t("inbox.controls.archives")}>
        <p className="text-xs text-dim">
          {archivedIds.length > 0
            ? t("inbox.archivedCount", { n: archivedIds.length })
            : t("inbox.archivesEmpty")}
        </p>
      </Panel>
    </div>
  );
}