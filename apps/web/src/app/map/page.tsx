"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { GoogleMapExplorer } from "@/components/maps/GoogleMapExplorer";
import { getHubDashboard } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n";
import type { PlaceResult } from "@nexus/types";

function MapContent() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const params = useSearchParams();
  const lat = params.get("lat");
  const lng = params.get("lng");
  const name = params.get("name") || undefined;
  const navigate = params.get("navigate") === "1";
  const [promoted, setPromoted] = useState<PlaceResult[]>([]);

  useEffect(() => {
    if (!session) return;
    getHubDashboard(session.accessToken)
      .then((d) => setPromoted(d.promoted_places || []))
      .catch(() => setPromoted([]));
  }, [session]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[#F5F5F5]">{t("map.title")}</h1>
        <p className="text-xs text-[#8A8A8A] mt-1">{t("map.subtitleLong")}</p>
      </div>
      <GoogleMapExplorer
        initialLat={lat ? parseFloat(lat) : undefined}
        initialLng={lng ? parseFloat(lng) : undefined}
        initialName={name}
        autoNavigate={navigate}
        promotedPlaces={promoted}
      />
    </div>
  );
}

export default function MapPage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <Suspense fallback={<div className="py-20 text-center text-xs text-[#5A5A5A]">{t("map.loading")}</div>}>
            <MapContent />
          </Suspense>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}