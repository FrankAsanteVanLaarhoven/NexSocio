"use client";

import Link from "next/link";
import { useState } from "react";
import { Panel } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useAuthStore } from "@/lib/auth-store";
import { groupsForSector } from "@/lib/settings-registry";

type SectorFilter = "personal" | "professional" | "all";

export default function SettingsPage() {
  const session = useAuthStore((s) => s.session);
  const viewContext = session?.viewContext ?? "personal";
  const [sector, setSector] = useState<SectorFilter>(
    viewContext === "professional" ? "professional" : "personal"
  );
  const [query, setQuery] = useState("");

  const groups = groupsForSector(sector).map((g) => ({
    ...g,
    items: g.items.filter(
      (i) =>
        !query.trim() ||
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.description?.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-2xl space-y-5 pb-12">
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Settings</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">
                Personal & professional — wallet · network · analytics · privacy
              </p>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search settings…"
              className="w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-4 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#5A5A5A]"
            />

            <div className="flex gap-1 p-1 rounded-lg border border-[#1F1F1F] bg-[#0A0A0A]">
              {(["personal", "professional", "all"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSector(s)}
                  className={`flex-1 py-2 text-xs capitalize rounded-md transition-colors ${
                    sector === s
                      ? s === "professional"
                        ? "bg-[#4FC3F7]/15 text-[#4FC3F7]"
                        : "bg-[#00E5FF]/15 text-[#00E5FF]"
                      : "text-[#8A8A8A] hover:text-[#F5F5F5]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { href: "/inbox", icon: "✉", label: "Inbox" },
                { href: "/wallet", icon: "💳", label: "Wallet" },
                { href: "/shop", icon: "🛒", label: "Shop" },
                { href: "/settings/analytics", icon: "📊", label: "Stats" },
              ].map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex flex-col items-center gap-1 rounded-lg border border-[#1F1F1F] py-3 hover:border-[#00E5FF]/30 transition-colors"
                >
                  <span className="text-lg">{q.icon}</span>
                  <span className="text-[10px] text-[#8A8A8A]">{q.label}</span>
                </Link>
              ))}
            </div>

            {groups.map((group) => (
              <Panel
                key={group.id}
                open
                title={group.title}
                subtitle={group.subtitle}
                className={
                  group.sector === "professional" ? "border-[#4FC3F7]/20" : undefined
                }
              >
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[#1A1A1A] transition-colors group"
                    >
                      {item.icon && (
                        <span className="w-8 h-8 flex items-center justify-center rounded-md border border-[#2A2A2A] text-sm shrink-0 group-hover:border-[#00E5FF]/30">
                          {item.icon}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#F5F5F5]">{item.label}</p>
                        {item.description && (
                          <p className="text-[10px] text-[#5A5A5A] truncate">{item.description}</p>
                        )}
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FF5252]/20 text-[#FF5252]">
                          {item.badge}
                        </span>
                      )}
                      <span className="text-[#5A5A5A] text-xs">›</span>
                    </Link>
                  ))}
                </div>
              </Panel>
            ))}
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}