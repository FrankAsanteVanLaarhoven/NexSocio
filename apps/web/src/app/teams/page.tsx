"use client";

import { Button, Input, Panel } from "@nexus/ui";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { createTeam, getTeamMembers, listTeams } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Team, TeamMember } from "@nexus/types";

export default function TeamsPage() {
  const session = useAuthStore((s) => s.session);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Record<string, TeamMember[]>>({});
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await listTeams(session.accessToken);
      setTeams(data);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!session || !name.trim()) return;
    setCreating(true);
    try {
      await createTeam(session.accessToken, {
        name: name.trim(),
        sector: session.viewContext === "professional" ? "professional" : "business",
      });
      setName("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function toggleMembers(teamId: string) {
    if (!session) return;
    if (members[teamId]) {
      const next = { ...members };
      delete next[teamId];
      setMembers(next);
      return;
    }
    const data = await getTeamMembers(session.accessToken, teamId);
    setMembers((prev) => ({ ...prev, [teamId]: data }));
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-5">
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
                <Button className="w-full" loading={creating} disabled={!name.trim()} onClick={handleCreate}>
                  Create team
                </Button>
              </div>
            </Panel>

            <Panel open title={`Your teams (${teams.length})`}>
              {loading ? (
                <p className="text-xs text-[#5A5A5A]">Loading…</p>
              ) : teams.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">No teams yet — create one above.</p>
              ) : (
                <div className="space-y-2">
                  {teams.map((t) => (
                    <div key={t.id} className="rounded-lg border border-[#2A2A2A] p-3">
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
                          {members[t.id] ? "Hide" : "Members"}
                        </button>
                      </div>
                      {members[t.id] && (
                        <ul className="mt-2 space-y-1 border-t border-[#1F1F1F] pt-2">
                          {members[t.id].map((m) => (
                            <li key={m.user_id} className="text-xs text-[#8A8A8A]">
                              {m.display_name} · {m.role}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Link
              href="/meetings"
              className="block text-center text-xs text-[#00E5FF] hover:underline"
            >
              Schedule a meeting →
            </Link>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}