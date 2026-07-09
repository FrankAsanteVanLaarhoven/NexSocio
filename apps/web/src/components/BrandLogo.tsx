"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BRAND_DISPLAY_NAME,
  BRAND_LOGO,
  BRAND_WORDMARK,
  type BrandLogoSize,
  type BrandLogoVariant,
} from "@/lib/brand";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  href?: string;
  className?: string;
};

const SIZES = {
  md: { box: "h-9 w-9", img: 36, text: "text-base sm:text-lg" },
  lg: { box: "h-11 w-11", img: 44, text: "text-lg sm:text-xl" },
} as const;

function LogoMark({ size = "lg", className = "" }: { size?: BrandLogoSize; className?: string }) {
  const dim = SIZES[size];
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${dim.box} ${className}`}>
      <Image
        src={BRAND_LOGO.markAccent}
        alt=""
        width={dim.img}
        height={dim.img}
        className={`${dim.box} object-contain drop-shadow-[0_0_10px_rgba(0,229,255,0.35)] [html[data-theme=light]_&]:hidden`}
        priority
        aria-hidden
      />
      <Image
        src={BRAND_LOGO.markAccentDark}
        alt=""
        width={dim.img}
        height={dim.img}
        className={`hidden ${dim.box} object-contain [html[data-theme=light]_&]:block`}
        priority
        aria-hidden
      />
    </span>
  );
}

export function BrandLogo({
  variant = "header",
  size = "lg",
  href,
  className = "",
}: BrandLogoProps) {
  const textSize = SIZES[size].text;

  const content =
    variant === "icon" ? (
      <LogoMark size={size} className={className} />
    ) : variant === "wordmark" ? (
      <span className={`inline-flex items-center font-bold tracking-tight ${textSize} ${className}`}>
        <span className="text-primary">{BRAND_WORDMARK.primary}</span>
        <span className="text-accent">{BRAND_WORDMARK.accent}</span>
      </span>
    ) : (
      <span className={`inline-flex items-center gap-3 ${className}`}>
        <LogoMark size={size} />
        <span className={`font-bold tracking-tight leading-none ${textSize}`}>
          <span className="text-primary">{BRAND_WORDMARK.primary}</span>
          <span className="text-accent">{BRAND_WORDMARK.accent}</span>
        </span>
      </span>
    );

  if (href === undefined) return content;

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center rounded-lg transition-opacity hover:opacity-90"
      aria-label={BRAND_DISPLAY_NAME}
    >
      {content}
    </Link>
  );
}