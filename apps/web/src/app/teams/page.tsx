"use client";

import { Button, Input, Panel, FadeIn, AnimatedList, AnimatedListItem } from "@nexus/ui";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useCreateTeam, useTeamMembers, useTeams } from "@/hooks/queries/useTeams";
import { useAuthStore } from "@/lib/auth-store";

export default function TeamsPage() {
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
      sector: session?.viewContext === "professional" ? "professional" : "business",
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
                ← Settings
              </Link>
              <h1 className="text-xl font-semibold text-[#F5F5F5] mt-2">Teams</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">Business teams · meetings · collaboration</p>
            </div>

            <Panel open title="Create team">
              <div className="space-y-3">
                <Input
                  label="Team name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Product squad"
                />
                <Button
                  className="w-full"
                  loading={createTeam.isPending}
                  disabled={!name.trim()}
                  onClick={handleCreate}
                >
                  Create team
                </Button>
              </div>
            </Panel>

            <Panel open title={`Your teams (${teams.length})`}>
              {isLoading ? (
                <p className="text-xs text-[#5A5A5A]">Loading…</p>
              ) : teams.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">No teams yet — create one above.</p>
              ) : (
                <AnimatedList className="space-y-2">
                  {teams.map((t) => (
                    <AnimatedListItem key={t.id}>
                      <div className="rounded-lg border border-[#2A2A2A] p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-[#F5F5F5] font-medium">{t.name}</p>
                            <p className="text-[10px] text-[#5A5A5A] mt-0.5">
                              {t.member_count} members · {t.sector}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleMembers(t.id)}
                            className="text-[10px] text-[#00E5FF] uppercase tracking-wider"
                          >
                            {expandedTeamId === t.id ? "Hide" : "Members"}
                          </button>
                        </div>
                        {expandedTeamId === t.id && (
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
              Schedule a meeting →
            </Link>
          </FadeIn>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}