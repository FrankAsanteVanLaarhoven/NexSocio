"use client";

import Link from "next/link";
import { Panel } from "@nexus/ui";
import { AppIcon } from "@/components/icons/AppIcon";
import { useTranslation } from "@/i18n";
import { INBOX_CONTROL_GROUPS } from "@/lib/inbox-hub-registry";
import { useInboxStore } from "@/lib/inbox-store";

export function InboxControlsPanel() {
  const { t } = useTranslation();
  const { preferences, updatePreferences } = useInboxStore();

  return (
    <div className="space-y-4">
      {INBOX_CONTROL_GROUPS.map((group) => (
        <Panel key={group.id} open title={t(group.titleKey)}>
          <div className="space-y-1">
            {group.items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-elevated transition-colors group"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-default group-hover:border-accent">
                  <AppIcon name={item.icon} size={15} className="text-muted group-hover:text-accent" />
                </span>
                <span className="text-sm text-primary">{t(item.labelKey)}</span>
              </Link>
            ))}
          </div>
        </Panel>
      ))}

      <div id="privacy" />
      <Panel open title={t("inbox.quickPrefs")}>
        <div className="space-y-2">
          {(
            [
              ["privateAccount", "inbox.controls.privateAccount"],
              ["mentionsEnabled", "inbox.controls.mentions"],
              ["reuseContentAllowed", "inbox.controls.reuse"],
              ["dataSaver", "inbox.controls.dataSaver"],
              ["offlineVideos", "inbox.controls.offlineVideos"],
              ["timeWellbeingReminders", "inbox.controls.timeWellbeing"],
              ["familyPairingEnabled", "inbox.controls.familyPairing"],
              ["accessibilityCaptions", "inbox.controls.accessibility"],
            ] as const
          ).map(([key, labelKey]) => (
            <button
              key={key}
              type="button"
              onClick={() =>
                updatePreferences({
                  [key]: !preferences[key],
                })
              }
              className="flex w-full items-center justify-between rounded-lg border border-default px-3 py-2.5 text-left hover:border-[var(--color-border-hover)]"
            >
              <span className="text-sm text-primary">{t(labelKey)}</span>
              <span
                className={`h-5 w-9 rounded-full transition-colors ${
                  preferences[key] ? "bg-accent" : "bg-[var(--color-border)]"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    preferences[key] ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}