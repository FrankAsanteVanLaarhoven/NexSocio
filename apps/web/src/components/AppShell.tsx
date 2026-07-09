"use client";

import { TacticalGrid } from "@nexus/ui";
import { BetaBanner } from "./BetaBanner";
import { Header } from "./Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <TacticalGrid />
      <BetaBanner />
      <Header />
      <main className="relative z-10 px-6 py-12">{children}</main>
    </div>
  );
}