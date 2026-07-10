"use client";

import dynamic from "next/dynamic";
import { TacticalGrid } from "@nexus/ui";
import { BetaBanner } from "./BetaBanner";
import { ErrorBoundary } from "./ErrorBoundary";
import { EphemeralHeader } from "./EphemeralHeader";
import { SectorBanner } from "./SectorBanner";
import { APP_CONTAINER } from "@/lib/layout";

const LocationTracker = dynamic(
  () => import("./LocationTracker").then((m) => m.LocationTracker),
  { ssr: false }
);
const VoiceCommander = dynamic(
  () => import("./VoiceCommander").then((m) => m.VoiceCommander),
  { ssr: false }
);

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <TacticalGrid />
      <BetaBanner />
      <EphemeralHeader />
      <SectorBanner />
      <main className={`relative z-10 ${APP_CONTAINER} py-10 sm:py-14 lg:py-16`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <LocationTracker />
      <VoiceCommander />
    </div>
  );
}