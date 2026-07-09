"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";

/** True once zustand persist has finished reading localStorage. */
export function useAuthHydrated(): boolean {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [ready, setReady] = useState(hasHydrated);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setReady(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setReady(true));
  }, []);

  return ready || hasHydrated;
}