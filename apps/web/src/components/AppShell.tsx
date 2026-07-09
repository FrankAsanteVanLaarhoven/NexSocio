"use client";

import { TacticalGrid } from "@nexus/ui";
import { BetaBanner } from "./BetaBanner";
import { ErrorBoundary } from "./ErrorBoundary";
import { EphemeralHeader } from "./EphemeralHeader";
import { LocationTracker } from "./LocationTracker";
import { VoiceCommander } from "./VoiceCommander";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <TacticalGrid />
      <BetaBanner />
      <EphemeralHeader />
      <main className="relative z-10 px-4 sm:px-6 py-8 sm:py-12">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <LocationTracker />
      <VoiceCommander />
    </div>
  );
}