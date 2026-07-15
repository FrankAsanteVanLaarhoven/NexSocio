"use client";

import { useAuthStore } from "@/lib/auth-store";
import { useAuthHydrated } from "@/hooks/useAuthHydrated";
import { AppShell } from "@/components/AppShell";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const hydrated = useAuthHydrated();
  const session = useAuthStore((s) => s.session);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
      </div>
    );
  }

  // Route guard: verify role is admin or moderator
  const hasAccess = session && (session.role === "admin" || session.role === "moderator");

  if (!hasAccess) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
          <div className="max-w-md w-full rounded-lg border border-[#FF5252]/20 bg-[#FF5252]/5 p-8 text-center space-y-4 backdrop-blur-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FF5252]/15 text-[#FF5252] text-xl font-bold">
              !
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#F5F5F5]">
              Access Denied
            </h2>
            <p className="text-sm text-[#8A8A8A] leading-relaxed">
              You do not have authorization to view the Moderator Control Panel. Please log in with a moderator or administrator account.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AdminDashboard />
    </AppShell>
  );
}
