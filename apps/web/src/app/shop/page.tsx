"use client";

import Link from "next/link";
import { Button, Panel } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useAuthStore } from "@/lib/auth-store";

const PRODUCTS = [
  { id: "1", name: "NEXSOCIO Hoodie", price: "£45", stock: 12 },
  { id: "2", name: "Digital Twin Setup", price: "£99", stock: "∞" },
  { id: "3", name: "Pro Analytics Pack", price: "£19/mo", stock: "∞" },
];

export default function ShopPage() {
  const session = useAuthStore((s) => s.session);
  const viewContext = session?.viewContext ?? "personal";

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-5 pb-12">
            <div>
              <Link href="/settings" className="text-xs text-[#8A8A8A] hover:text-[#00E5FF]">← Settings</Link>
              <h1 className="text-xl font-semibold text-[#F5F5F5] mt-2">Shop</h1>
              <p className="text-xs text-[#8A8A8A]">
                {viewContext === "professional" ? "Business orders & sales" : "Personal purchases"}
              </p>
            </div>
            <Panel open title="Products">
              {PRODUCTS.map((p) => (
                <div key={p.id} className="flex justify-between items-center py-3 border-b border-[#1F1F1F]">
                  <div>
                    <p className="text-sm text-[#F5F5F5]">{p.name}</p>
                    <p className="text-xs text-[#00E5FF]">{p.price}</p>
                  </div>
                  <Button size="sm" variant="secondary">Add</Button>
                </div>
              ))}
            </Panel>
            <Panel open title="Cart">
              <p className="text-xs text-[#5A5A5A]">Cart empty</p>
            </Panel>
            <Panel open title="Business orders">
              <p className="text-xs text-[#8A8A8A]">Order #1042 — Shipped · Order #1038 — Processing</p>
            </Panel>
            <Panel open title="QR code">
              <div className="mx-auto h-36 w-36 rounded-xl border border-[#2A2A2A] flex items-center justify-center text-[#5A5A5A] text-xs text-center p-4">
                Shop QR<br />Scan to pay
              </div>
              <Button size="sm" className="w-full mt-3" variant="secondary">Share shop link</Button>
            </Panel>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}