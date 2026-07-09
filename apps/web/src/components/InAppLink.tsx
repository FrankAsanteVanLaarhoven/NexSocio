"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

export function inAppReadUrl(url: string) {
  return `/read?url=${encodeURIComponent(url)}`;
}

export function inAppMapUrl(opts: {
  lat: number;
  lng: number;
  name?: string;
  placeId?: string;
  navigate?: boolean;
}) {
  const params = new URLSearchParams({
    lat: String(opts.lat),
    lng: String(opts.lng),
  });
  if (opts.name) params.set("name", opts.name);
  if (opts.placeId) params.set("place_id", opts.placeId);
  if (opts.navigate) params.set("navigate", "1");
  return `/map?${params}`;
}

export function InAppLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  if (!isExternal(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => router.push(inAppReadUrl(href))}
    >
      {children}
    </button>
  );
}