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
import { isImageUrl, isVideoUrl, resolveMediaUrl } from "@/lib/media-formats";
import { useAuthStore } from "@/lib/auth-store";
import { useTranslation } from "@/i18n";

const CATEGORIES = [
  { id: "all", labelKey: "common.all" },
  { id: "apparel", labelKey: "marketplace.categories.apparel" },
  { id: "digital", labelKey: "marketplace.categories.digital" },
  { id: "creator", labelKey: "marketplace.categories.creator" },
  { id: "subscriptions", labelKey: "marketplace.categories.subscriptions" },
  { id: "general", labelKey: "marketplace.categories.general" },
] as const;

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
  const { t } = useTranslation();

  return (
    <article className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-4 flex flex-col">
      {product.media_url && (
        <div className="mb-3 overflow-hidden rounded-lg border border-[#2A2A2A] aspect-video max-h-36 bg-black">
          {isVideoUrl(product.media_url) ? (
            <video
              src={resolveMediaUrl(product.media_url)}
              controls
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={resolveMediaUrl(product.media_url)}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
      )}
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
          {product.is_digital ? t("marketplace.digital") : t("marketplace.stockLeft", { n: product.stock })}
        </span>
        <Button
          size="sm"
          loading={adding === product.id}
          disabled={!product.is_digital && product.stock < 1}
          onClick={() => onAdd(product.id)}
        >
          {t("marketplace.addToCart")}
        </Button>
      </div>
    </article>
  );
}

export default function MarketplacePage() {
  const { t } = useTranslation();
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
      setMessage(e instanceof Error ? e.message : t("marketplace.addFailed"));
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
      setMessage(t("marketplace.orderPlaced", { amount: formatPrice(result.total_paid, result.currency) }));
      const wallet = await getWallet(session.accessToken);
      setBalance(wallet.balance);
      setCart(await getCart(session.accessToken));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t("marketplace.checkoutFailed"));
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
                <h1 className="text-xl font-semibold text-[#F5F5F5]">{t("marketplace.title")}</h1>
                <p className="text-xs text-[#8A8A8A] mt-1">{t("marketplace.subtitle")}</p>
              </div>
              <div className="flex items-center gap-3">
                {balance != null && (
                  <Link
                    href="/wallet"
                    className="text-xs px-3 py-1.5 rounded-md border border-[#2A2A2A] text-[#8A8A8A] hover:text-[#00E5FF]"
                  >
                    {t("marketplace.walletBalance", { amount: formatPrice(balance, "GBP") })}
                  </Link>
                )}
                {cart && cart.item_count > 0 && (
                  <span className="text-xs px-2 py-1 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                    {t("marketplace.inCart", { n: cart.item_count })}
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
                  {t(c.labelKey)}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                className="flex-1"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("marketplace.searchPlaceholder")}
              />
              <Button size="sm" variant="secondary" onClick={load}>
                {t("common.search")}
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <div>
                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-sm text-[#8A8A8A] text-center py-16">{t("marketplace.empty")}</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {products.map((p) => (
                      <ProductCard key={p.id} product={p} onAdd={handleAdd} adding={adding} />
                    ))}
                  </div>
                )}
              </div>

              <Panel open title={t("marketplace.cart", { n: cart?.item_count ?? 0 })}>
                {!cart?.items.length ? (
                  <p className="text-xs text-[#5A5A5A]">{t("marketplace.cartEmpty")}</p>
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
                      <span className="text-[#8A8A8A]">{t("marketplace.subtotal")}</span>
                      <span className="text-[#F5F5F5] font-medium">
                        {formatPrice(cart.subtotal, cart.currency)}
                      </span>
                    </div>
                    <Button className="w-full" loading={checkingOut} onClick={handleCheckout}>
                      {t("marketplace.checkout")}
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