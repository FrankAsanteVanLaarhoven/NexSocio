"use client";

import type { MarketplaceProduct, Order } from "@nexus/types";
import { Button, Input, Panel } from "@nexus/ui";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { MediaUploader } from "@/components/MediaUploader";
import { StatCard } from "@/components/settings/SettingsSectionShell";
import type { UploadedMedia } from "@/lib/media-upload";
import {
  createProduct,
  getMarketplaceDashboard,
  getMyProducts,
  getOrders,
  getSalesOrders,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { normalizeSector } from "@/lib/sectors";
import { useTranslation } from "@/i18n";

const CATEGORIES = ["general", "apparel", "digital", "creator", "subscriptions"];

function formatPrice(amount: number, currency: string) {
  const sym = currency === "GBP" ? "£" : currency === "USD" ? "$" : `${currency} `;
  return `${sym}${amount.toFixed(2)}`;
}

export default function ShopPage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const activeSector = normalizeSector(session?.viewContext);
  const [listings, setListings] = useState<MarketplaceProduct[]>([]);
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [dash, setDash] = useState({ active_listings: 0, total_sales: 0, orders_to_fulfill: 0, currency: "GBP" });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [listingMedia, setListingMedia] = useState<UploadedMedia | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const [mine, orders, sellerOrders, dashboard] = await Promise.all([
        getMyProducts(session.accessToken),
        getOrders(session.accessToken),
        getSalesOrders(session.accessToken),
        getMarketplaceDashboard(session.accessToken),
      ]);
      setListings(mine);
      setPurchases(orders);
      setSales(sellerOrders);
      setDash(dashboard);
    } catch {
      setListings([]);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!session || !title.trim() || !price) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await createProduct(session.accessToken, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        is_digital: category === "digital" || category === "subscriptions",
        media_url: listingMedia?.url,
        media_type: listingMedia?.media_type,
      });
      setTitle("");
      setDescription("");
      setPrice("");
      setListingMedia(null);
      setMessage(t("shop.listingPublished"));
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t("shop.createFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  const shopUrl = typeof window !== "undefined" ? `${window.location.origin}/marketplace` : "/marketplace";

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-5 pb-12">
            <div>
              <Link href="/settings" className="text-xs text-[#8A8A8A] hover:text-[#00E5FF]">
                {t("common.backToSettings")}
              </Link>
              <h1 className="text-xl font-semibold text-[#F5F5F5] mt-2">{t("shop.title")}</h1>
              <p className="text-xs text-[#8A8A8A]">
                {activeSector !== "personal" ? t("shop.subtitle") : t("shop.subtitlePersonal")}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard label={t("shop.statsListings")} value={String(dash.active_listings)} />
              <StatCard label={t("shop.statsSales")} value={formatPrice(dash.total_sales, dash.currency)} />
              <StatCard label={t("shop.statsToFulfill")} value={String(dash.orders_to_fulfill)} />
            </div>

            <Link
              href="/marketplace"
              className="block rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF]/5 px-4 py-3 text-sm text-[#00E5FF] hover:border-[#00E5FF]/50 transition-colors"
            >
              {t("shop.browseMarketplace")}
            </Link>

            <Panel open title={t("shop.createListing")}>
              <div className="space-y-3">
                <Input label={t("shop.titleLabel")} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("shop.titlePlaceholder")} />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("shop.description")}
                  rows={3}
                  className="w-full resize-none rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5] placeholder:text-[#5A5A5A] focus:outline-none focus:border-[#00E5FF]/50"
                />
                <Input label={t("shop.priceLabel")} value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t("shop.pricePlaceholder")} />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <MediaUploader
                  context="shop"
                  token={session.accessToken}
                  label={t("shop.mediaLabel")}
                  previewUrl={listingMedia?.url}
                  onUploaded={setListingMedia}
                  onClear={() => setListingMedia(null)}
                  compact
                />
                <Button className="w-full" loading={submitting} disabled={!title.trim() || !price} onClick={handleCreate}>
                  {t("shop.publishListing")}
                </Button>
                {message && <p className="text-[10px] text-[#8A8A8A]">{message}</p>}
              </div>
            </Panel>

            <Panel open title={t("shop.myListings")}>
              {listings.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">{t("shop.noListings")}</p>
              ) : (
                listings.map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-3 border-b border-[#1F1F1F]">
                    <div>
                      <p className="text-sm text-[#F5F5F5]">{p.image_emoji} {p.title}</p>
                      <p className="text-xs text-[#00E5FF]">{formatPrice(p.price, p.currency)} · {p.status}</p>
                    </div>
                  </div>
                ))
              )}
            </Panel>

            <Panel open title={t("shop.yourOrders")}>
              {purchases.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">{t("shop.noPurchases")}</p>
              ) : (
                purchases.map((o) => (
                  <div key={o.id} className="py-2 border-b border-[#1F1F1F] text-xs">
                    <p className="text-[#F5F5F5]">
                      #{o.id.slice(0, 8)} · {o.status} · {formatPrice(o.total, o.currency)}
                    </p>
                    <p className="text-[#5A5A5A] mt-0.5">{t("shop.orderFrom", { name: o.seller_name })}</p>
                  </div>
                ))
              )}
            </Panel>

            <Panel open title={t("shop.businessSales")}>
              {sales.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">{t("shop.noSales")}</p>
              ) : (
                sales.map((o) => (
                  <div key={o.id} className="py-2 border-b border-[#1F1F1F] text-xs">
                    <p className="text-[#F5F5F5]">
                      #{o.id.slice(0, 8)} · {o.status} · {formatPrice(o.total, o.currency)}
                    </p>
                    <p className="text-[#5A5A5A] mt-0.5">{t("shop.orderTo", { name: o.buyer_name })}</p>
                  </div>
                ))
              )}
            </Panel>

            <Panel open title={t("shop.qrCode")}>
              <div className="mx-auto h-36 w-36 rounded-xl border border-[#2A2A2A] flex flex-col items-center justify-center text-[#5A5A5A] text-xs text-center p-4 gap-2">
                <span className="text-3xl">▣</span>
                {t("shop.qrScan")}
              </div>
              <p className="text-[10px] text-[#5A5A5A] text-center mt-2 break-all">{shopUrl}</p>
              <Button
                size="sm"
                className="w-full mt-3"
                variant="secondary"
                onClick={() => navigator.clipboard?.writeText(shopUrl)}
              >
                {t("shop.copyLink")}
              </Button>
            </Panel>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}