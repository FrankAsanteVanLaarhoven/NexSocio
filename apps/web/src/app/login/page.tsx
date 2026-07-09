"use client";

import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const session = useAuthStore((s) => s.session);
  const router = useRouter();

  useEffect(() => {
    if (session) router.replace("/feed");
  }, [session, router]);

  return (
    <AppShell>
      <AuthHydrationGate>
        <LoginGateway />
      </AuthHydrationGate>
    </AppShell>
  );
}