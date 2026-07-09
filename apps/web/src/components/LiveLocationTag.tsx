"use client";

import Link from "next/link";
import { formatLocationAge } from "@/lib/location";
import { inAppMapUrl } from "@/components/InAppLink";

export function LiveLocationTag({
  label,
  isLive,
  since,
  lat,
  lng,
  compact,
}: {
  label: string;
  isLive?: boolean;
  since?: string;
  lat?: number | null;
  lng?: number | null;
  compact?: boolean;
}) {
  const timeRef = since || new Date().toISOString();
  const timeText = isLive ? `live ${formatLocationAge(timeRef)}` : formatLocationAge(timeRef);

  const pill = (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        isLive
          ? "border-[#FF5252]/40 bg-[#FF5252]/10 text-[#FF8A80]"
          : "border-[#00E5FF]/30 bg-[#00E5FF]/5 text-[#4FC3F7]"
      } ${compact ? "" : "mt-2"}`}
    >
      <span className={isLive ? "animate-pulse" : ""}>📍</span>
      <span className="truncate max-w-[180px]">{label}</span>
      <span className="text-[#5A5A5A]">·</span>
      <span className="text-[#8A8A8A] whitespace-nowrap">{timeText}</span>
    </span>
  );

  if (lat != null && lng != null) {
    return (
      <Link
        href={inAppMapUrl({ lat, lng, name: label, navigate: true })}
        className="inline-block hover:opacity-80 transition-opacity"
      >
        {pill}
      </Link>
    );
  }

  return pill;
}