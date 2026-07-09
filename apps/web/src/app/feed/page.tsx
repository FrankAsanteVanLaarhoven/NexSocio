"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Feed } from "@/components/Feed";
import { useAuthHydrated } from "@/hooks/useAuthHydrated";
import { useAuthStore } from "@/lib/auth-store";

export default function FeedPage() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    if (hydrated && !session) {
      router.replace("/");
    }
  }, [hydrated, session, router]);

  if (!hydrated || !session) {
    return null;
  }

  return (
    <AppShell>
      <Feed />
    </AppShell>
  );
}