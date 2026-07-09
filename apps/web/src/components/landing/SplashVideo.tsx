"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function SplashVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onReady = () => setReady(true);
    const play = () => {
      void video.play().catch(() => {});
    };

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", play);
    play();

    return () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", play);
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-[#0a1628]">
      <Image
        src="/brand-splash-reference.jpg"
        alt=""
        fill
        priority
        className={`object-cover transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
        sizes="100vw"
        aria-hidden
      />
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        src="/splash-nexsocio.mp4"
        poster="/brand-splash-reference.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label="NexSocio splash animation"
      />
    </div>
  );
}