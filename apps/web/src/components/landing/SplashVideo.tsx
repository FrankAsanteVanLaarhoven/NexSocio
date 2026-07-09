"use client";

import { useEffect, useRef } from "react";
import { BRAND_COLORS, BRAND_LOGO } from "@/lib/brand";

const SPLASH_SRC = `${BRAND_LOGO.splashVideo}?v=6`;

export function SplashVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const play = () => {
      void video.play().catch(() => {});
    };

    play();
    video.addEventListener("canplay", play);
    document.addEventListener("visibilitychange", play);

    return () => {
      video.removeEventListener("canplay", play);
      document.removeEventListener("visibilitychange", play);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: BRAND_COLORS.base }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 z-0 h-full w-full object-cover opacity-[0.92] saturate-[1.12] contrast-[1.06] brightness-[0.95]"
        style={{ filter: "hue-rotate(-12deg)" }}
        src={SPLASH_SRC}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label="NexSocio splash animation"
      />

      {/* Accent colour grade — ties video to app cyan */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] mix-blend-soft-light opacity-70"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 42%, rgba(${BRAND_COLORS.accentRgb} / 0.22), transparent 68%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-50"
        style={{
          background: `linear-gradient(160deg, rgba(${BRAND_COLORS.accentRgb} / 0.14) 0%, transparent 42%, rgba(10, 22, 40, 0.55) 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(to top, ${BRAND_COLORS.base}ee 0%, transparent 38%, ${BRAND_COLORS.navy}55 100%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ boxShadow: `inset 0 0 100px rgba(${BRAND_COLORS.accentRgb} / 0.14)` }}
      />
    </div>
  );
}