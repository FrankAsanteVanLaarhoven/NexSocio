"use client";

import { Button, Input, Panel, FadeIn, AnimatedList, AnimatedListItem } from "@nexus/ui";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useCreateTeam, useTeamMembers, useTeams } from "@/hooks/queries/useTeams";
import { useAuthStore } from "@/lib/auth-store";
import { normalizeSector } from "@/lib/sectors";
import { useTranslation } from "@/i18n";

export default function TeamsPage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const { data: teams = [], isLoading } = useTeams(token);
  const createTeam = useCreateTeam(token);
  const [name, setName] = useState("");
  const [expandedTeamId, setExpandedTeamId] = useState<string | undefined>();
  const { data: members = [] } = useTeamMembers(token, expandedTeamId);

  async function handleCreate() {
    if (!name.trim()) return;
    await createTeam.mutateAsync({
      name: name.trim(),
      sector:
        normalizeSector(session?.viewContext) === "business_corporate"
          ? "professional"
          : "business",
    });
    setName("");
  }

  function toggleMembers(teamId: string) {
    setExpandedTeamId((prev) => (prev === teamId ? undefined : teamId));
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <FadeIn className="mx-auto max-w-lg space-y-5">
            <div>
              <Link href="/settings" className="text-xs text-[#8A8A8A] hover:text-[#00E5FF]">
                {t("common.backToSettings")}
              </Link>
              <h1 className="text-xl font-semibold text-[#F5F5F5] mt-2">{t("teams.title")}</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">{t("teams.subtitle")}</p>
            </div>

            <Panel open title={t("teams.createTeam")}>
              <div className="space-y-3">
                <Input
                  label={t("teams.teamName")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("teams.teamPlaceholder")}
                />
                <Button
                  className="w-full"
                  loading={createTeam.isPending}
                  disabled={!name.trim()}
                  onClick={handleCreate}
                >
                  {t("teams.createTeam")}
                </Button>
              </div>
            </Panel>

            <Panel open title={t("teams.yourTeams", { n: teams.length })}>
              {isLoading ? (
                <p className="text-xs text-[#5A5A5A]">{t("common.loading")}</p>
              ) : teams.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">{t("teams.empty")}</p>
              ) : (
                <AnimatedList className="space-y-2">
                  {teams.map((team) => (
                    <AnimatedListItem key={team.id}>
                      <div className="rounded-lg border border-[#2A2A2A] p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-[#F5F5F5] font-medium">{team.name}</p>
                            <p className="text-[10px] text-[#5A5A5A] mt-0.5">
                              {t("common.members", { n: team.member_count })} · {team.sector}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleMembers(team.id)}
                            className="text-[10px] text-[#00E5FF] uppercase tracking-wider"
                          >
                            {expandedTeamId === team.id ? t("teams.hide") : t("teams.membersBtn")}
                          </button>
                        </div>
                        {expandedTeamId === team.id && (
                          <ul className="mt-2 space-y-1 border-t border-[#1F1F1F] pt-2">
                            {members.map((m) => (
                              <li key={m.user_id} className="text-xs text-[#8A8A8A]">
                                {m.display_name} · {m.role}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </AnimatedListItem>
                  ))}
                </AnimatedList>
              )}
            </Panel>

            <Link
              href="/meetings"
              className="block text-center text-xs text-[#00E5FF] hover:underline"
            >
              {t("teams.scheduleMeeting")}
            </Link>
          </FadeIn>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}