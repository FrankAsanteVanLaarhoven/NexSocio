"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { LiquidLogo } from "./LiquidLogo";
import { SITE_DOMAIN } from "@/lib/site";

function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute left-1/2 top-[38%] h-[min(90vw,520px)] w-[min(90vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1a3a6b]/40" />
      <div className="absolute left-1/2 top-[38%] h-[min(70vw,400px)] w-[min(70vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#1a3a6b]/25" />
      <div className="absolute left-1/2 top-[38%] h-[min(50vw,280px)] w-[min(50vw,280px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#007bff]/15" />

      {[
        { top: "12%", left: "18%", delay: 0 },
        { top: "22%", right: "14%", delay: 0.4 },
        { top: "68%", left: "12%", delay: 0.8 },
        { top: "74%", right: "20%", delay: 1.1 },
        { top: "48%", left: "8%", delay: 0.6 },
        { top: "55%", right: "9%", delay: 1.4 },
      ].map((dot, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-[#007bff]"
          style={{ top: dot.top, left: dot.left, right: dot.right }}
          animate={{ opacity: [0.25, 0.9, 0.25], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: dot.delay, ease: "easeInOut" }}
        />
      ))}

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#007bff]/10 to-transparent" />
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1628] text-white">
      <AmbientBackground />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:py-16">
        {/* Splash hero — phone-style center on mobile */}
        <motion.div
          className="flex w-full max-w-md flex-col items-center text-center lg:max-w-xl lg:items-start lg:text-left"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6 h-44 w-36 sm:h-52 sm:w-44 lg:h-56 lg:w-48">
            <LiquidLogo className="h-full w-full" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="text-white">Nex</span>
            <span className="text-[#007bff]">Socio</span>
          </h1>

          <p className="mt-3 text-xs font-medium tracking-[0.35em] text-white/70 sm:text-sm">
            CONNECT. SHARE. ENGAGE.
          </p>

          <div className="mt-4 h-px w-16 bg-[#007bff]/60 lg:mx-0 mx-auto" />

          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/55">
            Your social platform for feeds, live calls, marketplace, digital twins, and real connections — on web and mobile.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              href="/register"
              className="rounded-full bg-[#007bff] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#007bff]/30 transition hover:bg-[#1a8cff] hover:shadow-[#007bff]/45"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-[#007bff]/50 hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-8 text-[11px] tracking-wide text-white/35">
            {SITE_DOMAIN}
          </p>
        </motion.div>

        {/* QR + mobile splash card */}
        <motion.div
          className="mt-14 flex w-full max-w-xs flex-col items-center lg:mt-0"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative w-[min(100%,280px)] rounded-[2rem] border border-white/10 bg-[#0d1f3c]/80 p-3 shadow-2xl shadow-black/40 backdrop-blur-md">
            <div className="overflow-hidden rounded-[1.6rem] border border-[#1a3a6b]/50 bg-[#0a1628] px-6 pb-8 pt-10">
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

          <p className="mt-4 text-[10px] font-medium tracking-[0.3em] text-white/40 uppercase">
            Splash screen
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white p-4 shadow-xl shadow-black/30">
            <Image
              src="/qr-nexsocio.png"
              alt={`QR code to open ${SITE_DOMAIN}`}
              width={180}
              height={180}
              className="h-44 w-44"
              priority
            />
          </div>

          <p className="mt-3 text-center text-xs text-white/45">
            Scan to open on mobile
          </p>
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