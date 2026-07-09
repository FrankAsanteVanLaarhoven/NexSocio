"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { LiquidLogo } from "./LiquidLogo";
import { SITE_DOMAIN } from "@/lib/site";
import { useAuthHydrated } from "@/hooks/useAuthHydrated";
import { useAuthStore } from "@/lib/auth-store";

function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute left-1/2 top-1/2 h-[min(92vw,560px)] w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1a3a6b]/45" />
      <div className="absolute left-1/2 top-1/2 h-[min(72vw,420px)] w-[min(72vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1a3a6b]/28" />
      <div className="absolute left-1/2 top-1/2 h-[min(52vw,300px)] w-[min(52vw,300px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#007bff]/18" />

      {[
        { top: "14%", left: "20%", delay: 0 },
        { top: "24%", right: "16%", delay: 0.4 },
        { top: "70%", left: "14%", delay: 0.8 },
        { top: "76%", right: "22%", delay: 1.1 },
        { top: "50%", left: "10%", delay: 0.6 },
        { top: "58%", right: "11%", delay: 1.4 },
      ].map((dot, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-[#007bff]"
          style={{ top: dot.top, left: dot.left, right: dot.right }}
          animate={{ opacity: [0.25, 0.9, 0.25], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: dot.delay, ease: "easeInOut" }}
        />
      ))}

      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#007bff]/12 to-transparent" />
    </div>
  );
}

export function LandingPage() {
  const reduceMotion = useReducedMotion();
  const hydrated = useAuthHydrated();
  const session = useAuthStore((s) => s.session);

  const enter = reduceMotion
    ? { initial: false as const }
    : {
        initial: { y: 12 },
        animate: { y: 0 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden text-white"
      style={{ backgroundColor: "#0a1628", color: "#ffffff" }}
    >
      <AmbientBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-12 px-6 py-14 lg:flex-row lg:items-center lg:justify-center lg:gap-20">
        <motion.div
          className="flex w-full max-w-lg flex-col items-center text-center"
          {...enter}
        >
          <div className="mb-8 h-48 w-40 sm:h-56 sm:w-44">
            <LiquidLogo className="h-full w-full" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span style={{ color: "#ffffff" }}>Nex</span>
            <span style={{ color: "#007bff" }}>Socio</span>
          </h1>

          <p className="mt-4 text-xs font-semibold tracking-[0.38em] text-white/75 sm:text-sm">
            CONNECT. SHARE. ENGAGE.
          </p>

          <div className="mx-auto mt-5 h-px w-20 bg-[#007bff]/70" />

          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/60">
            Your social platform for feeds, live calls, marketplace, digital twins, and real connections.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {hydrated && session ? (
              <Link
                href="/feed"
                className="rounded-full bg-[#007bff] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#007bff]/35 transition hover:bg-[#1a8cff]"
              >
                Open feed
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-full bg-[#007bff] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#007bff]/35 transition hover:bg-[#1a8cff]"
                >
                  Get started
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-white/25 bg-white/8 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-[#007bff]/50 hover:bg-white/12"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          <p className="mt-8 text-[11px] tracking-[0.2em] text-white/40 uppercase">
            {SITE_DOMAIN}
          </p>
        </motion.div>

        <motion.div
          className="flex w-full max-w-xs flex-col items-center"
          {...(reduceMotion
            ? { initial: false as const }
            : {
                initial: { y: 16 },
                animate: { y: 0 },
                transition: { duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] as const },
              })}
        >
          <div className="w-[min(100%,280px)] rounded-[2rem] border border-white/12 bg-[#0d1f3c]/85 p-3 shadow-2xl shadow-black/50 backdrop-blur-md">
            <div className="rounded-[1.6rem] border border-[#1a3a6b]/55 bg-[#0a1628] px-6 pb-8 pt-10">
              <div className="mx-auto mb-5 h-24 w-20">
                <LiquidLogo className="h-full w-full opacity-90" />
              </div>
              <p className="text-center text-lg font-bold">
                <span className="text-white">Nex</span>
                <span className="text-[#007bff]">Socio</span>
              </p>
              <p className="mt-1 text-center text-[9px] tracking-[0.28em] text-white/50">
                CONNECT. SHARE. ENGAGE.
              </p>
              <div className="mt-6 flex justify-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#007bff]" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-white/12 bg-white p-4 shadow-xl shadow-black/35">
            <Image
              src="/qr-nexsocio.png"
              alt={`QR code to open ${SITE_DOMAIN}`}
              width={180}
              height={180}
              className="h-44 w-44"
              priority
            />
          </div>

          <p className="mt-3 text-center text-xs text-white/50">Scan to open on mobile</p>
          <a
            href="/qr-nexsocio.png"
            download="nexsocio-qr.png"
            className="mt-2 text-xs text-[#007bff] hover:text-[#66b3ff] transition"
          >
            Download QR
          </a>
        </motion.div>
      </div>
    </div>
  );
}