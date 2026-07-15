"use client";

import { useEffect, useState } from "react";
import { Button, Panel } from "@nexus/ui";
import {
  adminListMembers,
  adminUpdateMemberStatus,
  adminGetSafetyDashboard,
  adminListReports,
  adminModerateReport,
  adminListAuditLogs,
  adminGetPolicies,
  adminUpdatePolicy,
  adminListUserNotes,
  adminCreateUserNote,
  type AdminMember,
  type SafetyDashboardData,
  type ContentReport,
  type ModeratorActionLog,
  type SafetyPolicy,
  type UserModNote,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

type TabId = "users" | "reports" | "logs" | "policies";

export default function AdminDashboard() {
  const token = useAuthStore((s) => s.accessToken || s.session?.accessToken);
  const [activeTab, setActiveTab] = useState<TabId>("users");
  
  // Data States
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [safety, setSafety] = useState<SafetyDashboardData | null>(null);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<ModeratorActionLog[]>([]);
  const [policies, setPolicies] = useState<SafetyPolicy[]>([]);
  
  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Mod Notes Modal State
  const [selectedUser, setSelectedUser] = useState<AdminMember | null>(null);
  const [userNotes, setUserNotes] = useState<UserModNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);

  // Report Resolution State
  const [resolutionReason, setResolutionReason] = useState("");

  async function loadDashboardData() {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch base dashboard stats & users
      const [membersData, safetyData] = await Promise.all([
        adminListMembers(token),
        adminGetSafetyDashboard(token),
      ]);
      setMembers(membersData);
      setSafety(safetyData);

      // Fetch reports, logs, and policies in parallel
      const [reportsData, logsData, policiesData] = await Promise.all([
        adminListReports(token),
        adminListAuditLogs(token),
        adminGetPolicies(token),
      ]);
      setReports(reportsData);
      setAuditLogs(logsData);
      setPolicies(policiesData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin metrics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  // User Actions
  async function handleToggleStatus(userId: string, currentStatus: string) {
    if (!token) return;
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      setActionLoading(`user-status-${userId}`);
      await adminUpdateMemberStatus(token, userId, newStatus);
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, status: newStatus } : m))
      );
      // Reload audit logs
      const logsData = await adminListAuditLogs(token);
      setAuditLogs(logsData);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update member status");
    } finally {
      setActionLoading(null);
    }
  }

  // Mod Notes Actions
  async function handleViewNotes(member: AdminMember) {
    if (!token) return;
    setSelectedUser(member);
    setNewNote("");
    try {
      setNotesLoading(true);
      const notes = await adminListUserNotes(token, member.id);
      setUserNotes(notes);
    } catch (e) {
      alert("Failed to load moderation notes");
    } finally {
      setNotesLoading(false);
    }
  }

  async function handleAddNote() {
    if (!token || !selectedUser || !newNote.trim()) return;
    try {
      setNotesLoading(true);
      const note = await adminCreateUserNote(token, selectedUser.id, newNote);
      setUserNotes((prev) => [note, ...prev]);
      setNewNote("");
    } catch (e) {
      alert("Failed to add moderation note");
    } finally {
      setNotesLoading(false);
    }
  }

  // Report Actions
  async function handleModerateReport(reportId: string, action: "approve" | "remove") {
    if (!token) return;
    const reason = resolutionReason.trim() || `Report moderated as ${action}`;
    try {
      setActionLoading(`report-${reportId}`);
      await adminModerateReport(token, reportId, action, reason);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setResolutionReason("");
      
      // Reload stats and logs
      const [safetyData, logsData] = await Promise.all([
        adminGetSafetyDashboard(token),
        adminListAuditLogs(token),
      ]);
      setSafety(safetyData);
      setAuditLogs(logsData);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to moderate content");
    } finally {
      setActionLoading(null);
    }
  }

  // Policy Actions
  async function handleTogglePolicy(key: string, currentValue: string) {
    if (!token) return;
    const newValue = currentValue === "true" ? "false" : "true";
    try {
      setActionLoading(`policy-${key}`);
      await adminUpdatePolicy(token, key, newValue);
      setPolicies((prev) =>
        prev.map((p) => (p.key === key ? { ...p, value: newValue } : p))
      );
      // Reload logs
      const logsData = await adminListAuditLogs(token);
      setAuditLogs(logsData);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update safety policy");
    } finally {
      setActionLoading(null);
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
  const emergencyMode = policies.find((p) => p.key === "emergency_mode")?.value === "true";
  const readOnlyMode = policies.find((p) => p.key === "read_only_mode")?.value === "true";

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Admin Title Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#2A2A2A] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#F5F5F5] bg-gradient-to-r from-[#F5F5F5] to-[#00E5FF] bg-clip-text text-transparent">
              Enterprise Control Room
            </h1>
            {emergencyMode && (
              <span className="inline-flex items-center rounded-full bg-[#FF5252]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FF5252] border border-[#FF5252]/20 animate-pulse">
                Emergency Safe Mode Active
              </span>
            )}
          </div>
          <p className="text-sm text-[#8A8A8A] mt-1.5">
            Audit logs, content queues, mod records, and emergency override switches.
          </p>
        </div>
        <Button onClick={loadDashboardData} className="px-5">
          Sync Metrics
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
          <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">Report Queue</p>
          <p className="mt-2 text-2xl font-extrabold text-[#FF8F00]">
            {reports.filter((r) => r.status === "open").length}
          </p>
        </div>
        <div className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]/50 p-4 backdrop-blur-md">
          <p className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">Safety Incidents</p>
          <p className="mt-2 text-2xl font-extrabold text-[#FF5252]">
            {safety?.blocked_count ?? 0}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#2A2A2A]">
        {(["users", "reports", "logs", "policies"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-6 text-sm font-semibold tracking-wide border-b-2 uppercase transition-all ${
              activeTab === tab
                ? "border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/5"
                : "border-transparent text-[#8A8A8A] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]/30"
            }`}
          >
            {tab === "users" && "User Directory"}
            {tab === "reports" && "Reports Queue"}
            {tab === "logs" && "Audit Trail"}
            {tab === "policies" && "Safety Policies"}
          </button>
        ))}
      </div>

      {/* Active Tab Panel Rendering */}
      <div className="min-h-[500px]">
        {/* User Directory Tab */}
        {activeTab === "users" && (
          <Panel open title="Live User Tracker" subtitle="Monitor active members, notes history, and login logs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#E0E0E0] border-collapse">
                <thead>
                  <tr className="border-b border-[#2A2A2A] text-xs uppercase tracking-wider text-[#8A8A8A]">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role / Mode</th>
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
                      <td className="py-3.5 px-4 text-xs font-mono">
                        <span className="capitalize">{member.role}</span> · <span className="capitalize">{member.mode}</span>
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
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleViewNotes(member)}
                          className="text-xs py-1 px-3 border border-[#2A2A2A]"
                        >
                          Notes
                        </Button>
                        <Button
                          variant={member.status === "active" ? "ghost" : "primary"}
                          onClick={() => handleToggleStatus(member.id, member.status)}
                          className="text-xs py-1 px-3"
                          disabled={actionLoading === `user-status-${member.id}`}
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
        )}

        {/* Reports Queue Tab */}
        {activeTab === "reports" && (
          <Panel open title="Pending Content Reports" subtitle="Review reported items and flag violations">
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter moderation decision context/reason..."
                  value={resolutionReason}
                  onChange={(e) => setResolutionReason(e.target.value)}
                  className="flex-1 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-4 py-2 text-sm text-[#F5F5F5] focus:border-[#00E5FF] focus:outline-none"
                />
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-12 border border-[#2A2A2A] border-dashed rounded-lg text-[#8A8A8A]">
                  No reports awaiting moderation review.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]/40 p-4 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="inline-flex items-center rounded-full bg-[#FF5252]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FF5252]">
                            {report.reason}
                          </span>
                          <p className="text-xs text-[#8A8A8A] mt-1">
                            Reported on: {new Date(report.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-xs font-mono text-[#5A5A5A]">
                          ID: {report.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="bg-[#050505] p-3 rounded border border-[#1A1A1A] text-sm text-[#E0E0E0] min-h-[60px] font-mono leading-relaxed">
                        {report.details || "No details provided by reporter."}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleModerateReport(report.id, "approve")}
                          className="text-xs py-1 px-3 text-[#00C853] hover:bg-[#00C853]/10"
                          disabled={actionLoading === `report-${report.id}`}
                        >
                          Dismiss Report
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleModerateReport(report.id, "remove")}
                          className="text-xs py-1 px-3 bg-[#FF5252] hover:bg-[#FF5252]/80 border-none"
                          disabled={actionLoading === `report-${report.id}`}
                        >
                          Remove Content
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        )}

        {/* Audit Trail Tab */}
        {activeTab === "logs" && (
          <Panel open title="Moderator Activity Logs" subtitle="Security transparency ledger of admin actions">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#E0E0E0] border-collapse">
                <thead>
                  <tr className="border-b border-[#2A2A2A] text-xs uppercase tracking-wider text-[#8A8A8A]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Moderator</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target ID</th>
                    <th className="py-3 px-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#8A8A8A]">
                        No logs recorded.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#0A0A0A]/30 transition-colors">
                        <td className="py-3 px-4 text-xs text-[#8A8A8A] font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#F5F5F5]">
                          {log.moderator_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          <span
                            className={`rounded px-1.5 py-0.5 ${
                              log.action.includes("remove") || log.action.includes("suspend")
                                ? "bg-[#FF5252]/10 text-[#FF5252]"
                                : "bg-[#00C853]/10 text-[#00C853]"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#8A8A8A] font-mono">
                          {log.target_type} ({log.target_id.slice(0, 8)})
                        </td>
                        <td className="py-3 px-4 text-xs text-[#E0E0E0] max-w-[200px] truncate">
                          {log.reason}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {/* Global Safety Policies Tab */}
        {activeTab === "policies" && (
          <Panel open title="Global Safety Overrides" subtitle="Manage network restrictions and auto-censorship metrics">
            <div className="max-w-xl space-y-6">
              {/* Emergency Safe Mode policy */}
              <div className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]/40 p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-[#F5F5F5]">Emergency Safe Mode</h3>
                    <p className="text-xs text-[#8A8A8A] mt-1 leading-relaxed">
                      Auto-modifies moderation toxicity sensitivity thresholds. All content matches with moderate toxicity score checks are blocked automatically.
                    </p>
                  </div>
                  <button
                    onClick={() => handleTogglePolicy("emergency_mode", emergencyMode ? "true" : "false")}
                    disabled={actionLoading === "policy-emergency_mode"}
                    className={`h-6 w-11 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                      emergencyMode ? "bg-[#00E5FF]" : "bg-[#2A2A2A]"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-[#FFFFFF] shadow-md transform transition-transform duration-200 ease-in-out ${
                        emergencyMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Read Only/Maintenance Mode Policy */}
              <div className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A]/40 p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-[#F5F5F5]">Maintenance / Read-Only Mode</h3>
                    <p className="text-xs text-[#8A8A8A] mt-1 leading-relaxed">
                      Temporarily blocks the creation of new posts, comments, reels, or profile updates across the whole application network.
                    </p>
                  </div>
                  <button
                    onClick={() => handleTogglePolicy("read_only_mode", readOnlyMode ? "true" : "false")}
                    disabled={actionLoading === "policy-read_only_mode"}
                    className={`h-6 w-11 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                      readOnlyMode ? "bg-[#00E5FF]" : "bg-[#2A2A2A]"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-[#FFFFFF] shadow-md transform transition-transform duration-200 ease-in-out ${
                        readOnlyMode ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        )}
      </div>

      {/* Moderation Notes Drawer/Overlay */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg h-full border-l border-[#2A2A2A] bg-[#0A0A0A]/95 p-6 shadow-2xl flex flex-col space-y-6 text-[#E0E0E0] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#F5F5F5]">
                  Moderation Log: {selectedUser.display_name}
                </h3>
                <p className="text-xs text-[#8A8A8A] mt-1">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-[#8A8A8A] hover:text-[#F5F5F5] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Note Entry form */}
            <div className="space-y-3.5">
              <label className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">
                Add Moderation Note / Warning
              </label>
              <textarea
                placeholder="Log moderation reasoning, warning issues, or client context details..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-[#2A2A2A] bg-[#050505] p-3 text-sm text-[#F5F5F5] focus:border-[#00E5FF] focus:outline-none font-mono"
              />
              <div className="flex justify-end">
                <Button onClick={handleAddNote} disabled={notesLoading || !newNote.trim()}>
                  Add Mod Note
                </Button>
              </div>
            </div>

            {/* Notes history list */}
            <div className="flex-1 flex flex-col space-y-3.5 overflow-hidden">
              <h4 className="text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">
                Mod History Logs ({userNotes.length})
              </h4>
              <div className="flex-1 space-y-3.5 overflow-y-auto pr-1">
                {notesLoading && userNotes.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
                  </div>
                ) : userNotes.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#5A5A5A]">
                    No moderator history recorded for this user.
                  </div>
                ) : (
                  userNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-[#2A2A2A] bg-[#0E0E0E] p-4 space-y-2"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#00E5FF]">
                          {note.moderator_name}
                        </span>
                        <span className="text-[#8A8A8A] font-mono">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-[#E0E0E0] font-mono leading-relaxed bg-[#050505] p-2.5 rounded border border-[#1A1A1A]">
                        {note.note}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
