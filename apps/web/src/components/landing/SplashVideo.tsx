"use client";

import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";

export function SplashVideo() {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;

    const play = () => {
      void video.play().catch(() => {});
    };

    play();
    video.addEventListener("canplay", play);
    return () => video.removeEventListener("canplay", play);
  }, [reduceMotion]);

  return (
    <div className="absolute inset-0">
      {reduceMotion ? (
        <Image
          src="/brand-splash-reference.jpg"
          alt="NexSocio splash"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src="/splash-nexsocio.mp4"
          poster="/brand-splash-reference.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="NexSocio splash animation"
        />
      )}
    </div>
  );
}