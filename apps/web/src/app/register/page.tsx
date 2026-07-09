"use client";

import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { KidsRegisterFlow } from "@/components/auth/KidsRegisterFlow";
import { RegisterFlow } from "@/components/RegisterFlow";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RegisterContent() {
  const params = useSearchParams();
  const isKids = params.get("kids") === "1";

  if (isKids) {
    return <KidsRegisterFlow />;
  }

  return (
    <div className="space-y-4">
      <RegisterFlow onComplete={() => window.location.assign("/feed")} />
      <p className="text-center text-xs text-[#5A5A5A]">
        Registering a child?{" "}
        <Link href="/register?kids=1" className="text-[#7C4DFF] hover:underline">
          Kids Face ID registration
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AppShell>
      <AuthHydrationGate>
        <Suspense>
          <RegisterContent />
        </Suspense>
      </AuthHydrationGate>
    </AppShell>
  );
}