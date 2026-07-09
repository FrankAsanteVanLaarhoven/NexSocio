"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { SplashVideo } from "./SplashVideo";
import { SITE_DOMAIN } from "@/lib/site";
import { useAuthHydrated } from "@/hooks/useAuthHydrated";
import { useAuthStore } from "@/lib/auth-store";

export function LandingPage() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const enterApp = useCallback(() => {
    if (!hydrated) return;
    router.push(session ? "/feed" : "/login");
  }, [hydrated, session, router]);

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] w-full overflow-hidden bg-[#0a1628]">
      <SplashVideo />

      <button
        type="button"
        onClick={enterApp}
        disabled={!hydrated}
        className="absolute inset-0 z-[1] cursor-pointer disabled:cursor-wait"
        aria-label="Enter NexSocio"
      />

      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-[#0a1628]/95 via-[#0a1628]/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-20">
        <button
          type="button"
          onClick={enterApp}
          disabled={!hydrated}
          className="pointer-events-auto min-w-[12rem] rounded-full bg-[#007bff] px-10 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#007bff]/40 transition hover:bg-[#1a8cff] disabled:opacity-60"
        >
          {hydrated && session ? "Enter app" : "Tap to enter"}
        </button>

        {hydrated && !session && (
          <p className="pointer-events-auto mt-4 text-center text-xs text-white/55">
            New here?{" "}
            <Link href="/register" className="text-[#66b3ff] hover:text-[#99ccff] underline-offset-2 hover:underline">
              Create account
            </Link>
          </p>
        )}

        <p className="mt-5 text-[11px] tracking-[0.25em] text-white/40 uppercase">
          {SITE_DOMAIN}
        </p>
      </div>
    </div>
  );
}