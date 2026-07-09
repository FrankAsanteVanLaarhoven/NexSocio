"use client";

import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { Feed } from "@/components/Feed";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useAuthStore } from "@/lib/auth-store";

export default function FeedPage() {
  const session = useAuthStore((s) => s.session);

  return (
    <AppShell>
      <AuthHydrationGate>
        {session ? <Feed /> : <LoginGateway />}
      </AuthHydrationGate>
    </AppShell>
  );
}