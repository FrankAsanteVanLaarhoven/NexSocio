"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SplashVideo } from "./SplashVideo";
import { SITE_DOMAIN } from "@/lib/site";
import { useAuthHydrated } from "@/hooks/useAuthHydrated";
import { useAuthStore } from "@/lib/auth-store";

export function LandingPage() {
  const hydrated = useAuthHydrated();
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] w-full overflow-hidden bg-[#0a1628]">
      <SplashVideo />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a1628]/90 via-[#0a1628]/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-16">
        <div className="pointer-events-auto flex flex-row flex-wrap items-center justify-center gap-4">
          {hydrated && session ? (
            <Link
              href="/feed"
              className="min-w-[9rem] rounded-full bg-[#007bff] px-8 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-[#007bff]/40 transition hover:bg-[#1a8cff]"
            >
              Open feed
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="min-w-[9rem] rounded-full bg-[#007bff] px-8 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-[#007bff]/40 transition hover:bg-[#1a8cff]"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="min-w-[9rem] rounded-full border border-white/30 bg-black/30 px-8 py-3.5 text-center text-sm font-semibold text-white backdrop-blur-md transition hover:border-[#007bff]/60 hover:bg-black/45"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        <p className="mt-5 text-[11px] tracking-[0.25em] text-white/45 uppercase">
          {SITE_DOMAIN}
        </p>
      </div>
    </div>
  );
}