"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { SplashVideo } from "./SplashVideo";
import { BRAND_COLORS } from "@/lib/brand";
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
    <div
      className="fixed inset-0 z-50 h-[100dvh] w-full overflow-hidden"
      style={{ backgroundColor: BRAND_COLORS.base }}
    >
      <SplashVideo />

      <button
        type="button"
        onClick={enterApp}
        disabled={!hydrated}
        className="absolute inset-0 z-[3] cursor-pointer disabled:cursor-wait"
        aria-label="Enter NexSocio"
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-48"
        style={{
          background: `linear-gradient(to top, ${BRAND_COLORS.base} 0%, transparent 100%)`,
        }}
      />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-20">
        <button
          type="button"
          onClick={enterApp}
          disabled={!hydrated}
          className="pointer-events-auto min-w-[12rem] rounded-full bg-accent px-10 py-3.5 text-sm font-semibold text-[var(--color-on-accent)] shadow-lg shadow-accent/40 transition hover:brightness-110 disabled:opacity-60"
        >
          {hydrated && session ? "Enter app" : "Tap to enter"}
        </button>

        {hydrated && !session && (
          <p className="pointer-events-auto mt-4 text-center text-xs text-white/55">
            New here?{" "}
            <Link
              href="/register"
              className="text-accent hover:brightness-125 underline-offset-2 hover:underline"
            >
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