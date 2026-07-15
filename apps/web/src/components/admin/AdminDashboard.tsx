"use client";

import { useEffect, useState } from "react";
import { Button, Panel } from "@nexus/ui";
import {
  adminListMembers,
  adminUpdateMemberStatus,
  adminGetSafetyDashboard,
  type AdminMember,
  type SafetyDashboardData,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function AdminDashboard() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [safety, setSafety] = useState<SafetyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboardData() {
    if (!token) return;
    try {
      setLoading(true);
      const [membersData, safetyData] = await Promise.all([
        adminListMembers(token),
        adminGetSafetyDashboard(token),
      ]);
      setMembers(membersData);
      setSafety(safetyData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  async function handleToggleStatus(userId: string, currentStatus: string) {
    if (!token) return;
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await adminUpdateMemberStatus(token, userId, newStatus);
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, status: newStatus } : m))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update member status");
    }
  }

  if (loading && members.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  const liveCount = members.filter((m) => m.is_live).length;

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Admin Title Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#2A2A2A] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#F5F5F5] bg-gradient-to-r from-[#F5F5F5] to-[#00E5FF] bg-clip-text text-transparent">
            Moderator Control Panel
          </h1>
          <p className="text-sm text-[#8A8A8A] mt-1.5">
            Real-time server monitoring, live tracking, and content safety policies
          </p>
        </div>
        <Button onClick={loadDashboardData} className="px-5">
          Refresh Live Status
        </Button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]/50 p-4 backdrop-blur-md">
          <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">Total Members</p>
          <p className="mt-2 text-2xl font-extrabold text-[#F5F5F5]">{members.length}</p>
        </div>
        <div className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]/50 p-4 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-[#00E5FF] animate-pulse" />
          <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">Currently Live</p>
          <p className="mt-2 text-2xl font-extrabold text-[#00E5FF]">{liveCount}</p>
        </div>
        <div className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]/50 p-4 backdrop-blur-md">
          <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">Safety Flags</p>
          <p className="mt-2 text-2xl font-extrabold text-[#FF5252]">
            {safety?.blocked_count ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]/50 p-4 backdrop-blur-md">
          <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">Incidents Rate</p>
          <p className="mt-2 text-2xl font-extrabold text-[#FF8F00]">
            {safety?.incident_rate ?? 0}%
          </p>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Live Member directory */}
        <div className="xl:col-span-2 space-y-4">
          <Panel open title="Live User Tracker" subtitle="Monitor active members and logged sessions">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#E0E0E0] border-collapse">
                <thead>
                  <tr className="border-b border-[#2A2A2A] text-xs uppercase tracking-wider text-[#8A8A8A]">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-[#0A0A0A]/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="h-8 w-8 rounded-full bg-[#1A1A1A] flex items-center justify-center font-bold text-xs border border-[#2A2A2A]">
                              {member.display_name.slice(0, 2).toUpperCase()}
                            </div>
                            {member.is_live && (
                              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#00E5FF] border border-[#0A0A0A]" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[#F5F5F5]">{member.display_name}</p>
                            <p className="text-xs text-[#8A8A8A]">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs capitalize">
                        {member.mode}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            member.status === "active"
                              ? "bg-[#00C853]/10 text-[#00C853]"
                              : "bg-[#FF5252]/10 text-[#FF5252]"
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#8A8A8A]">
                        {member.is_live ? (
                          <span className="text-[#00E5FF] font-medium">Live Now</span>
                        ) : member.last_login_at ? (
                          <div>
                            <p>{new Date(member.last_login_at).toLocaleDateString()}</p>
                            <p className="text-[10px]">{member.location_label || "Unknown Location"}</p>
                          </div>
                        ) : (
                          "Never"
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant={member.status === "active" ? "ghost" : "primary"}
                          onClick={() => handleToggleStatus(member.id, member.status)}
                          className="text-xs py-1 px-3"
                        >
                          {member.status === "active" ? "Suspend" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        {/* Safety Incident Alerts */}
        <div className="space-y-4">
          <Panel open title="Safety Activity Logs" subtitle="Auto-moderated posts and policy actions">
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {safety?.recent_events && safety.recent_events.length > 0 ? (
                safety.recent_events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]/40 p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#F5F5F5] uppercase tracking-wide">
                        {event.action}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          parseFloat(event.score) > 0.7 ? "text-[#FF5252]" : "text-[#FF8F00]"
                        }`}
                      >
                        Tox: {event.score}
                      </span>
                    </div>
                    <p className="text-[#8A8A8A] font-mono leading-relaxed">
                      Matches: {event.labels || "none"}
                    </p>
                    <p className="text-[10px] text-[#5A5A5A] text-right">
                      {new Date(event.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#8A8A8A]">
                  No safety incidents recorded yet.
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
