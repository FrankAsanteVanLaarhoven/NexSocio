"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";

/** True once zustand persist has finished reading localStorage. */
export function useAuthHydrated(): boolean {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [ready, setReady] = useState(hasHydrated);

  useEffect(() => {
    const finish = () => setReady(true);
    if (useAuthStore.persist.hasHydrated()) {
      finish();
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(finish);
    const timeout = window.setTimeout(finish, 400);
    return () => {
      unsub();
      window.clearTimeout(timeout);
    };
  }, []);

  return ready || hasHydrated;
}