"use client";

import Link from "next/link";
import { Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { LiveLocationTag } from "@/components/LiveLocationTag";
import { inAppMapUrl } from "@/components/InAppLink";
import { getMemberLocations } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { formatLocationAge } from "@/lib/location";
import { useTranslation } from "@/i18n";
import type { MemberLocation } from "@nexus/types";
import { useSettingsStore } from "@/lib/settings-store";

function MemberCard({ member }: { member: MemberLocation }) {
  const { t } = useTranslation();

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        member.find_me_enabled
          ? "border-[#FF5252]/40 bg-[#FF5252]/5"
          : "border-[#1F1F1F] bg-[#111111]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#F5F5F5]">{member.display_name}</p>
          <p className="text-[10px] text-[#5A5A5A] mt-0.5">
            {t("find.updated")} {formatLocationAge(member.updated_at)}
          </p>
          <div className="mt-2">
            <LiveLocationTag
              label={member.location_label}
              isLive={member.is_live}
              since={member.live_since || member.updated_at}
              lat={member.lat}
              lng={member.lng}
              compact
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {member.find_me_enabled && (
            <span className="text-[9px] uppercase tracking-wider text-[#FF8A80] font-bold">
              {t("find.findMe")}
            </span>
          )}
          {member.is_live && (
            <span className="text-[9px] uppercase tracking-wider text-[#FF5252]">{t("find.live")}</span>
          )}
          <Link
            href={inAppMapUrl({
              lat: member.lat,
              lng: member.lng,
              name: member.display_name,
              navigate: true,
            })}
            className="text-[10px] text-[#00E5FF] hover:underline"
          >
            {t("find.mapLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FindPage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const findMe = useSettingsStore((s) => s.findMeEnabled);
  const [members, setMembers] = useState<MemberLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const list = await getMemberLocations(session.accessToken);
      setMembers(
        [...list].sort((a, b) => {
          if (a.find_me_enabled !== b.find_me_enabled) return a.find_me_enabled ? -1 : 1;
          if (a.is_live !== b.is_live) return a.is_live ? -1 : 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        })
      );
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const findMeCount = members.filter((m) => m.find_me_enabled).length;
  const liveCount = members.filter((m) => m.is_live).length;

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-[#F5F5F5]">{t("find.title")}</h1>
                <p className="text-xs text-[#8A8A8A] mt-1">{t("find.subtitle")}</p>
              </div>
              <Link
                href="/settings/location"
                className="text-[10px] px-2 py-1 rounded border border-[#2A2A2A] text-[#8A8A8A] hover:text-[#00E5FF]"
              >
                {t("find.settings")}
              </Link>
            </div>

            {findMe && (
              <div className="rounded-lg border border-[#FF5252]/40 bg-[#FF5252]/10 px-4 py-3 flex items-center gap-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF5252]" />
                <p className="text-xs text-[#FF8A80]">{t("find.findMeOn")}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t("find.visible"), value: String(members.length) },
                { label: t("find.findMe"), value: String(findMeCount) },
                { label: t("find.liveNow"), value: String(liveCount) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-3 text-center"
                >
                  <p className="text-[10px] uppercase tracking-wider text-[#5A5A5A]">{stat.label}</p>
                  <p className="mt-1 text-lg font-semibold text-[#4FC3F7]">{stat.value}</p>
                </div>
              ))}
            </div>

            <Panel open title={t("find.membersNearby")}>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-[#8A8A8A] text-center py-8">{t("find.noLocations")}</p>
              ) : (
                <div className="space-y-3">
                  {members.map((m) => (
                    <MemberCard key={m.user_id} member={m} />
                  ))}
                </div>
              )}
            </Panel>

            <p className="text-[10px] text-[#5A5A5A] text-center">{t("find.footerHint")}</p>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}