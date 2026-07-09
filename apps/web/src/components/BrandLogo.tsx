"use client";

import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  variant?: "header" | "icon" | "wordmark";
  href?: string;
  className?: string;
};

export function BrandLogo({ variant = "header", href = "/", className = "" }: BrandLogoProps) {
  const content =
    variant === "icon" ? (
      <Image
        src="/brand/logo-icon-transparent.png"
        alt="NexSocio"
        width={32}
        height={32}
        className={`h-8 w-8 object-contain ${className}`}
        priority
      />
    ) : variant === "wordmark" ? (
      <span className={`inline-flex items-center text-lg font-bold tracking-tight ${className}`}>
        <span className="text-primary">Nex</span>
        <span className="text-[#007bff]">Socio</span>
      </span>
    ) : (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        <Image
          src="/brand/logo-icon-transparent.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 object-contain"
          priority
          aria-hidden
        />
        <span className="text-base font-bold tracking-tight leading-none sm:text-lg">
          <span className="text-primary">Nex</span>
          <span className="text-[#007bff]">Socio</span>
        </span>
      </span>
    );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {content}
    </Link>
  );
}