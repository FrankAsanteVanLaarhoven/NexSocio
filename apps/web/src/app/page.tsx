"use client";

import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { Feed } from "@/components/Feed";
import { LandingPage } from "@/components/landing/LandingPage";
import { useAuthStore } from "@/lib/auth-store";

export default function HomePage() {
  const session = useAuthStore((s) => s.session);

  if (!session) {
    return <LandingPage />;
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        <Feed />
      </AuthHydrationGate>
    </AppShell>
  );
}