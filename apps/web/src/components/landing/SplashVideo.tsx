"use client";

import { useEffect, useRef } from "react";
import { BRAND_LOGO } from "@/lib/brand";

const SPLASH_SRC = `${BRAND_LOGO.splashVideo}?v=5`;

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
    <video
      ref={videoRef}
      className="absolute inset-0 z-0 h-full w-full object-cover"
      src={SPLASH_SRC}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-label="NexSocio splash animation"
    />
  );
}