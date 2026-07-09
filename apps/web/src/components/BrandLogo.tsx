"use client";

import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  variant?: "header" | "icon" | "wordmark";
  href?: string;
  className?: string;
};

const ASSETS = {
  icon: "/brand/logo-icon.jpg",
  header: "/brand/logo-horizontal-color.jpg",
  wordmark: "/brand/logo-wordmark.jpg",
} as const;

export function BrandLogo({ variant = "header", href = "/", className = "" }: BrandLogoProps) {
  const content =
    variant === "icon" ? (
      <Image
        src={ASSETS.icon}
        alt="NexSocio"
        width={28}
        height={28}
        className={`h-7 w-7 object-contain ${className}`}
        priority
      />
    ) : variant === "wordmark" ? (
      <Image
        src={ASSETS.wordmark}
        alt="NexSocio"
        width={160}
        height={40}
        className={`h-8 w-auto max-w-[10rem] object-contain object-left ${className}`}
        priority
      />
    ) : (
      <Image
        src={ASSETS.header}
        alt="NexSocio"
        width={180}
        height={36}
        className={`h-8 w-auto max-w-[11rem] object-contain object-left sm:max-w-[13rem] ${className}`}
        priority
      />
    );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {content}
    </Link>
  );
}