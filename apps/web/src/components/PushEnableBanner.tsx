"use client";

import { Button } from "@nexus/ui";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushEnableBanner({ token }: { token: string }) {
  const { subscribed, error, subscribe } = usePushNotifications(token);

  if (subscribed) return null;

  return (
    <div className="rounded-lg border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-[#F5F5F5]">Enable push notifications</p>
        <p className="text-[10px] text-[#5A5A5A] mt-0.5">Calls, messages & alerts when app is closed</p>
        {error && <p className="text-[10px] text-[#FF5252] mt-1">{error}</p>}
      </div>
      <Button variant="secondary" onClick={subscribe}>
        Enable
      </Button>
    </div>
  );
}