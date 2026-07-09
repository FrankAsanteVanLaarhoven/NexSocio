"use client";

import { ModeBadge } from "@nexus/ui";
import Link from "next/link";

import { usePathname } from "next/navigation";
import { useAuthHydrated } from "@/hooks/useAuthHydrated";
import { useAuthStore } from "@/lib/auth-store";

const NAV = [
  { href: "/", label: "Feed" },
  { href: "/connections", label: "Connections" },
  { href: "/robots", label: "Robots" },
  { href: "/safety", label: "Safety" },
  { href: "/profile", label: "Profile" },
];

export function Header() {
  const pathname = usePathname();

  const hydrated = useAuthHydrated();
  const session = useAuthStore((s) => s.session);
  const viewContext = session?.viewContext ?? "personal";
  const setViewContext = useAuthStore((s) => s.setViewContext);
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <header className="sticky top-0 z-50 border-b border-[#1F1F1F] bg-[#0A0A0A]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-[#00E5FF]/30 bg-[#00E5FF]/10">
              <span className="text-xs font-bold text-[#00E5FF]">N</span>
            </div>
            <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#F5F5F5]">
              Nexus
            </span>
          </Link>

          {hydrated && session && (
            <nav className="hidden sm:flex items-center gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    pathname === item.href
                      ? "text-[#00E5FF] bg-[#00E5FF]/10"
                      : "text-[#8A8A8A] hover:text-[#F5F5F5]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {hydrated && !session && (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs text-[#8A8A8A] hover:text-[#F5F5F5] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 text-xs rounded-md border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-colors"
            >
              Register
            </Link>
          </div>
        )}

        {hydrated && session && (
          <div className="flex items-center gap-3">
            <div className="flex rounded-md border border-[#2A2A2A] p-0.5">
              {(["personal", "professional"] as const).map((ctx) => (
                <button
                  key={ctx}
                  onClick={() => setViewContext(ctx)}
                  className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded transition-colors ${
                    viewContext === ctx
                      ? ctx === "professional"
                        ? "bg-[#4FC3F7]/20 text-[#4FC3F7]"
                        : "bg-[#00E5FF]/20 text-[#00E5FF]"
                      : "text-[#5A5A5A] hover:text-[#8A8A8A]"
                  }`}
                >
                  {ctx}
                </button>
              ))}
            </div>
            <span className="hidden md:inline text-xs text-[#8A8A8A]">{session.displayName}</span>
            <ModeBadge mode={session.mode} />
            <button
              onClick={clearSession}
              className="text-xs text-[#5A5A5A] hover:text-[#F5F5F5] transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}