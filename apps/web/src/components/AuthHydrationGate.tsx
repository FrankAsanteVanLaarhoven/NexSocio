"use client";

import { useAuthHydrated } from "@/hooks/useAuthHydrated";
import { PageLoader } from "./PageLoader";

export function AuthHydrationGate({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthHydrated();
  if (!hydrated) return <PageLoader />;
  return <>{children}</>;
}