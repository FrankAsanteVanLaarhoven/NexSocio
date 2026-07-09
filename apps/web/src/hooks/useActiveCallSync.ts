"use client";

import { useEffect } from "react";
import type { CallSession } from "@nexus/types";

/** Keep local active call in sync with polled React Query cache (e.g. callee answered). */
export function useActiveCallSync(
  calls: CallSession[],
  activeCall: CallSession | null,
  setActiveCall: (call: CallSession | null) => void
) {
  useEffect(() => {
    if (!activeCall) return;
    const fresh = calls.find((c) => c.id === activeCall.id);
    if (fresh && fresh.status !== activeCall.status) {
      setActiveCall(fresh);
    }
  }, [calls, activeCall, setActiveCall]);
}