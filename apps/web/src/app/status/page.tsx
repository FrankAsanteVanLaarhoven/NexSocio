"use client";

import { useState } from "react";
import { Button, Input, Panel, FadeIn, AnimatedList, AnimatedListItem } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useMyStatus, usePostStatus, useStatusFeed } from "@/hooks/queries/useStatus";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/i18n";

export default function StatusPage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const { data: feed = [], isLoading } = useStatusFeed(token);
  const { data: mine } = useMyStatus(token);
  const postStatus = usePostStatus(token);
  const [text, setText] = useState("");

  function timeLeft(expires: string) {
    const ms = new Date(expires).getTime() - Date.now();
    if (ms <= 0) return t("status.expired");
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? t("status.hoursLeft", { h, m }) : t("status.minutesLeft", { m });
  }

  async function handlePost() {
    if (!text.trim()) return;
    await postStatus.mutateAsync(text.trim());
    setText("");
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <FadeIn className="mx-auto max-w-lg space-y-5">
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">{t("status.title")}</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">{t("status.subtitle")}</p>
            </div>

            {mine && (
              <Panel open title={t("status.yours")}>
                <p className="text-sm text-[#F5F5F5]">{mine.text || t("status.mediaStatus")}</p>
                <p className="text-[10px] text-[#5A5A5A] mt-1">{timeLeft(mine.expires_at)}</p>
              </Panel>
            )}

            <Panel open title={t("status.postStatus")}>
              <div className="space-y-3">
                <Input
                  label={t("status.placeholder")}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t("status.callsAvailable")}
                />
                <Button
                  className="w-full"
                  loading={postStatus.isPending}
                  disabled={!text.trim()}
                  onClick={handlePost}
                >
                  {t("status.share24h")}
                </Button>
              </div>
            </Panel>

            <Panel open title={t("status.feed")}>
              {isLoading ? (
                <p className="text-xs text-[#5A5A5A]">{t("common.loading")}</p>
              ) : feed.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">{t("status.empty")}</p>
              ) : (
                <AnimatedList className="space-y-3">
                  {feed.map((s) => (
                    <AnimatedListItem key={s.id}>
                      <div className="rounded-lg border border-[#2A2A2A] p-3">
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-[#F5F5F5] font-medium">{s.display_name}</p>
                          <span className="text-[10px] text-[#5A5A5A]">{timeLeft(s.expires_at)}</span>
                        </div>
                        {s.text && <p className="text-xs text-[#8A8A8A] mt-1">{s.text}</p>}
                        {s.media_url && (
                          <p className="text-[10px] text-[#00E5FF] mt-1 truncate">{s.media_url}</p>
                        )}
                      </div>
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