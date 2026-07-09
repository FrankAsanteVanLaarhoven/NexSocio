"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import {
  createRobotTwin,
  getRobotDashboard,
  issueRobotCommand,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { DigitalTwin, RobotDashboard } from "@nexus/types";

export default function RobotsPage() {
  const session = useAuthStore((s) => s.session);
  const [dashboard, setDashboard] = useState<RobotDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState("status");
  const [selectedAgent, setSelectedAgent] = useState("twin-001");
  const [newTwinName, setNewTwinName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await getRobotDashboard(session.accessToken);
      setDashboard(data);
      if (data.twins.length > 0) setSelectedAgent(data.twins[0].agent_id);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCommand() {
    if (!session) return;
    setMsg(null);
    try {
      const res = await issueRobotCommand(session.accessToken, selectedAgent, command);
      setMsg(res.message);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Command failed");
    }
  }

  async function handleCreateTwin() {
    if (!session || !newTwinName.trim()) return;
    await createRobotTwin(session.accessToken, newTwinName.trim());
    setNewTwinName("");
    await load();
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Robot & Agent Layer</h1>
          <p className="text-xs text-[#8A8A8A] mt-1">
            Digital twins · Safety-certified command channel
          </p>
        </div>

        {dashboard && (
          <div className="rounded-lg border border-[#4FC3F7]/20 bg-[#4FC3F7]/5 px-4 py-2">
            <p className="text-xs text-[#4FC3F7]">{dashboard.safety_channel_status}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
          </div>
        ) : (
          <>
            <Panel open title="Digital Twins">
              <div className="grid gap-3 sm:grid-cols-2">
                {dashboard?.twins.map((twin: DigitalTwin) => (
                  <button
                    key={twin.agent_id}
                    onClick={() => setSelectedAgent(twin.agent_id)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      selectedAgent === twin.agent_id
                        ? "border-[#00E5FF]/50 bg-[#00E5FF]/5"
                        : "border-[#2A2A2A] hover:border-[#3A3A3A]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#F5F5F5]">{twin.name}</p>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          twin.status === "online" ? "bg-[#00C853]" : "bg-[#FFB300]"
                        }`}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-[#5A5A5A]">{twin.agent_id}</p>
                    <p className="mt-2 text-xs text-[#8A8A8A]">
                      {twin.social_status} · {twin.safety_channel}
                    </p>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel open title="Issue Command" subtitle="Certified allowlist: move, stop, scan, greet, status">
              <div className="space-y-3">
                <Input
                  label="Command"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="status"
                />
                <Button className="w-full" onClick={handleCommand}>
                  Send to {selectedAgent}
                </Button>
                {msg && <p className="text-xs text-[#8A8A8A]">{msg}</p>}
              </div>
            </Panel>

            <Panel open title="Create Digital Twin">
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  placeholder="Twin name..."
                  value={newTwinName}
                  onChange={(e) => setNewTwinName(e.target.value)}
                />
                <Button onClick={handleCreateTwin}>Create</Button>
              </div>
            </Panel>

            {dashboard && dashboard.recent_commands.length > 0 && (
              <Panel open title="Recent Commands">
                <div className="space-y-2">
                  {dashboard.recent_commands.map((cmd, i) => (
                    <div key={i} className="flex justify-between text-xs border-b border-[#1F1F1F] pb-2">
                      <span className="text-[#8A8A8A]">{cmd.agent_id}: {cmd.command}</span>
                      <span className={cmd.safety_check === "passed" || cmd.safety_check === "passed_stub" ? "text-[#00C853]" : "text-[#FF5252]"}>
                        {cmd.safety_check}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </>
        )}
      </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}