"use client";

import type { Cart, MarketplaceProduct } from "@nexus/types";
import { Button, Input, Panel } from "@nexus/ui";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import {
  addToCart,
  checkout,
  getCart,
  getMarketplaceProducts,
  getWallet,
  removeFromCart,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "apparel", label: "Apparel" },
  { id: "digital", label: "Digital" },
  { id: "creator", label: "Creator" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "general", label: "General" },
];

function formatPrice(amount: number, currency: string) {
  const sym = currency === "GBP" ? "£" : currency === "USD" ? "$" : `${currency} `;
  return `${sym}${amount.toFixed(2)}`;
}

function ProductCard({
  product,
  onAdd,
  adding,
}: {
  product: MarketplaceProduct;
  onAdd: (id: string) => void;
  adding: string | null;
}) {
  return (
    <article className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-4 flex flex-col">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] text-2xl">
          {product.image_emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#F5F5F5] truncate">{product.title}</p>
          <p className="text-[10px] text-[#5A5A5A] mt-0.5">{product.seller_name}</p>
          <p className="text-sm text-[#00E5FF] mt-1 font-semibold">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      </div>
      <p className="text-xs text-[#8A8A8A] mt-3 line-clamp-2 flex-1">{product.description}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[10px] text-[#5A5A5A] uppercase tracking-wider">
          {product.is_digital ? "Digital" : `${product.stock} left`}
        </span>
        <Button
          size="sm"
          loading={adding === product.id}
          disabled={!product.is_digital && product.stock < 1}
          onClick={() => onAdd(product.id)}
        >
          Add to cart
        </Button>
      </div>
    </article>
  );
}

export default function MarketplacePage() {
  const session = useAuthStore((s) => s.session);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [prods, cartData, wallet] = await Promise.all([
        getMarketplaceProducts({
          category: category === "all" ? undefined : category,
          q: query.trim() || undefined,
        }),
        getCart(session.accessToken),
        getWallet(session.accessToken),
      ]);
      setProducts(prods);
      setCart(cartData);
      setBalance(wallet.balance);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [session, category, query]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(productId: string) {
    if (!session) return;
    setAdding(productId);
    setMessage(null);
    try {
      const updated = await addToCart(session.accessToken, productId);
      setCart(updated);
      const wallet = await getWallet(session.accessToken);
      setBalance(wallet.balance);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not add to cart");
    } finally {
      setAdding(null);
    }
  }

  async function handleRemove(productId: string) {
    if (!session) return;
    const updated = await removeFromCart(session.accessToken, productId);
    setCart(updated);
  }

  async function handleCheckout() {
    if (!session || !cart?.items.length) return;
    setCheckingOut(true);
    setMessage(null);
    try {
      const result = await checkout(session.accessToken);
      setMessage(`Order placed · ${formatPrice(result.total_paid, result.currency)} paid`);
      const wallet = await getWallet(session.accessToken);
      setBalance(wallet.balance);
      setCart(await getCart(session.accessToken));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-5xl space-y-6 pb-12">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-[#F5F5F5]">Marketplace</h1>
                <p className="text-xs text-[#8A8A8A] mt-1">
                  Buy from members · sell in{" "}
                  <Link href="/shop" className="text-[#00E5FF] hover:underline">
                    Shop
                  </Link>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {balance != null && (
                  <Link
                    href="/wallet"
                    className="text-xs px-3 py-1.5 rounded-md border border-[#2A2A2A] text-[#8A8A8A] hover:text-[#00E5FF]"
                  >
                    Wallet · {formatPrice(balance, "GBP")}
                  </Link>
                )}
                {cart && cart.item_count > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                    {cart.item_count} in cart
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    category === c.id
                      ? "border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF]"
                      : "border-[#2A2A2A] text-[#8A8A8A] hover:border-[#3A3A3A]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                className="flex-1"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search marketplace…"
              />
              <Button size="sm" variant="secondary" onClick={load}>
                Search
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <div>
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-sm text-[#8A8A8A] text-center py-16">No products found.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {products.map((p) => (
                      <ProductCard key={p.id} product={p} onAdd={handleAdd} adding={adding} />
                    ))}
                  </div>
                )}
              </div>

              <Panel open title={`Cart${cart ? ` · ${cart.item_count}` : ""}`}>
                {!cart?.items.length ? (
                  <p className="text-xs text-[#5A5A5A]">Your cart is empty</p>
                ) : (
                  <div className="space-y-3">
                    {cart.items.map((item) => (
                      <div
                        key={item.product_id}
                        className="flex items-start justify-between gap-2 border-b border-[#1F1F1F] pb-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-[#F5F5F5] truncate">
                            {item.image_emoji} {item.title}
                          </p>
                          <p className="text-[10px] text-[#5A5A5A]">
                            ×{item.quantity} · {formatPrice(item.line_total, item.currency)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.product_id)}
                          className="text-[10px] text-[#5A5A5A] hover:text-[#FF5252]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-[#8A8A8A]">Subtotal</span>
                      <span className="text-[#F5F5F5] font-medium">
                        {formatPrice(cart.subtotal, cart.currency)}
                      </span>
                    </div>
                    <Button className="w-full" loading={checkingOut} onClick={handleCheckout}>
                      Checkout with wallet
                    </Button>
                    {message && (
                      <p className="text-[10px] text-[#8A8A8A] text-center">{message}</p>
                    )}
                  </div>
                )}
              </Panel>
            </div>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}