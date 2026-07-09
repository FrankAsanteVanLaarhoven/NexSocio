"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { RegisterFlow } from "@/components/RegisterFlow";
import {
  acceptConnection,
  getConnections,
  requestConnection,
  searchUsers,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Connection, PublicUser } from "@nexus/types";

export default function ConnectionsPage() {
  const session = useAuthStore((s) => s.session);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pending, setPending] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await getConnections(session.accessToken);
      setConnections(data.connections);
      setPending(data.pending_incoming);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    const results = await searchUsers(searchQuery);
    setSearchResults(results.filter((u) => u.id !== session?.userId));
  }

  async function handleConnect(userId: string) {
    if (!session) return;
    setActionLoading(userId);
    try {
      await requestConnection(session.accessToken, userId);
      await load();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAccept(connectionId: string) {
    if (!session) return;
    setActionLoading(connectionId);
    try {
      await acceptConnection(session.accessToken, connectionId);
      await load();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <RegisterFlow onComplete={() => window.location.reload()} />
        ) : (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Connections</h1>
          <p className="text-xs text-[#8A8A8A] mt-1">Build your social graph</p>
        </div>

        <Panel open title="Find People">
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder="Search by name or headline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-md border border-[#2A2A2A] p-3"
                >
                  <div>
                    <p className="text-sm text-[#F5F5F5]">{user.display_name}</p>
                    {user.headline && (
                      <p className="text-xs text-[#8A8A8A]">{user.headline}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={actionLoading === user.id}
                    onClick={() => handleConnect(user.id)}
                  >
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {pending.length > 0 && (
          <Panel open title={`Pending Requests (${pending.length})`}>
            <div className="space-y-2">
              {pending.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between rounded-md border border-[#2A2A2A] p-3"
                >
                  <p className="text-sm text-[#F5F5F5]">
                    {conn.other_display_name || "Unknown user"}
                  </p>
                  <Button
                    size="sm"
                    loading={actionLoading === conn.id}
                    onClick={() => handleAccept(conn.id)}
                  >
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <Panel open title={`Your Connections (${connections.length})`}>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
            </div>
          ) : connections.length === 0 ? (
            <p className="text-sm text-[#8A8A8A] text-center py-8">
              No connections yet. Search above to connect.
            </p>
          ) : (
            <div className="space-y-2">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center gap-3 rounded-md border border-[#1F1F1F] p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2A2A2A] bg-[#1A1A1A] text-xs text-[#00E5FF]">
                    {(conn.other_display_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-[#F5F5F5]">
                    {conn.other_display_name || "Connected user"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}