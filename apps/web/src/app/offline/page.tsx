import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] text-[#F5F5F5] px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 mb-6">
        <span className="text-lg font-bold text-[#00E5FF]">NS</span>
      </div>
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="text-sm text-[#8A8A8A] mt-2 max-w-sm">
        NEXSOCIO needs a connection for feeds, calls, and live features. Cached pages may still be available.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-[#00E5FF] hover:underline"
      >
        Try again
      </Link>
    </div>
  );
}