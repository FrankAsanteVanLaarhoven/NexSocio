"use client";

import Link from "next/link";
import { Panel } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useAuthStore } from "@/lib/auth-store";

const MESSAGES = [
  { id: "1", from: "Twin · Ava", preview: "3 messages while you were away", time: "2m", unread: true },
  { id: "2", from: "Jordan K.", preview: "Loved your restaurant post!", time: "1h", unread: true },
  { id: "3", from: "NEXSOCIO", preview: "Your payout is ready", time: "3h", unread: false },
  { id: "4", from: "Slack #general", preview: "Connector: 2 new mentions", time: "1d", unread: false },
];

export default function InboxPage() {
  const session = useAuthStore((s) => s.session);

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/settings" className="text-xs text-[#8A8A8A] hover:text-[#00E5FF]">← Settings</Link>
                <h1 className="text-xl font-semibold text-[#F5F5F5] mt-2">Inbox</h1>
              </div>
              <span className="text-[10px] text-[#FF5252]">3 new</span>
            </div>
            <Panel open title="Messages">
              {MESSAGES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`w-full text-left py-3 border-b border-[#1F1F1F] ${m.unread ? "opacity-100" : "opacity-70"}`}
                >
                  <div className="flex justify-between">
                    <span className={`text-sm ${m.unread ? "text-[#F5F5F5] font-medium" : "text-[#8A8A8A]"}`}>{m.from}</span>
                    <span className="text-[10px] text-[#5A5A5A]">{m.time}</span>
                  </div>
                  <p className="text-xs text-[#5A5A5A] mt-0.5 truncate">{m.preview}</p>
                </button>
              ))}
            </Panel>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}