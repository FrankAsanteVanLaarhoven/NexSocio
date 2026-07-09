"use client";

import { Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { InAppLink } from "@/components/InAppLink";
import { GoogleMapExplorer } from "@/components/maps/GoogleMapExplorer";
import { StockChart } from "@/components/hub/StockChart";
import Link from "next/link";
import { getHubDashboard, getMarketHistory } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useSettingsStore } from "@/lib/settings-store";
import type { HubDashboard, MarketHistory, MarketQuote } from "@nexus/types";
import { useTranslation } from "@/i18n";

const WORLD_CLOCKS = [
  { city: "London", tz: "Europe/London" },
  { city: "New York", tz: "America/New_York" },
  { city: "Tokyo", tz: "Asia/Tokyo" },
  { city: "Lagos", tz: "Africa/Lagos" },
  { city: "Sydney", tz: "Australia/Sydney" },
];

const RANGES = ["1d", "5d", "1mo", "3mo", "6mo", "1y"] as const;

const WEATHER_7 = [
  { day: "Today", hi: 18, lo: 11, icon: "⛅" },
  { day: "Fri", hi: 20, lo: 12, icon: "🌤" },
  { day: "Sat", hi: 22, lo: 14, icon: "☀️" },
  { day: "Sun", hi: 19, lo: 13, icon: "🌧" },
  { day: "Mon", hi: 17, lo: 10, icon: "⛅" },
  { day: "Tue", hi: 16, lo: 9, icon: "🌦" },
  { day: "Wed", hi: 18, lo: 11, icon: "☀️" },
];

function QuoteRow({
  q,
  active,
  onSelect,
}: {
  q: MarketQuote;
  active: boolean;
  onSelect: () => void;
}) {
  const up = q.change_percent >= 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
        active ? "bg-[#00E5FF]/10 border border-[#00E5FF]/30" : "hover:bg-[#1A1A1A] border border-transparent"
      }`}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#F5F5F5] truncate">{q.symbol}</p>
        <p className="text-[10px] text-[#5A5A5A] truncate">{q.name}</p>
      </div>
      <div className="text-right shrink-0 ml-2">
        <p className="text-xs text-[#F5F5F5] tabular-nums">
          {q.currency === "USD" ? "$" : ""}
          {q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p className={`text-[10px] tabular-nums ${up ? "text-[#00C853]" : "text-[#FF5252]"}`}>
          {up ? "+" : ""}
          {q.change_percent.toFixed(2)}%
        </p>
      </div>
    </button>
  );
}

export default function HubPage() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const { timezone, currency, locale, likes, wishlist, hubHistory, addHubHistory } =
    useSettingsStore();
  const [now, setNow] = useState(new Date());
  const [dash, setDash] = useState<HubDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("AAPL");
  const [range, setRange] = useState<(typeof RANGES)[number]>("1mo");
  const [history, setHistory] = useState<MarketHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"markets" | "news" | "map">("markets");

  const loadDash = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHubDashboard(session?.accessToken);
      setDash(data);
      if (data.markets.length && !data.markets.find((m) => m.symbol === selected)) {
        setSelected(data.markets[0].symbol);
      }
    } catch {
      setDash(null);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, selected]);

  const loadHistory = useCallback(async (symbol: string, r: string) => {
    setHistoryLoading(true);
    try {
      const h = await getMarketHistory(symbol, r);
      setHistory(h);
      addHubHistory(symbol);
    } catch {
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  }, [addHubHistory]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadDash();
    const poll = setInterval(loadDash, 60_000);
    return () => clearInterval(poll);
  }, [loadDash]);

  useEffect(() => {
    if (selected) loadHistory(selected, range);
  }, [selected, range, loadHistory]);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const selectedQuote = dash?.markets.find((m) => m.symbol === selected);

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-[#F5F5F5]">{t("hub.title")}</h1>
                <p className="text-xs text-[#8A8A8A] mt-1">{t("hub.subtitle")}</p>
              </div>
              {dash && (
                <p className="text-[10px] text-[#5A5A5A]">
                  {t("hub.updated")} {new Date(dash.updated_at).toLocaleTimeString(locale)} · {t("common.source")} {dash.source}
                </p>
              )}
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1">
              {(["markets", "news", "map"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 px-4 py-2 text-xs uppercase tracking-wider rounded-full border transition-colors ${
                    activeTab === tab
                      ? "border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]"
                      : "border-[#2A2A2A] text-[#8A8A8A] hover:border-[#3A3A3A]"
                  }`}
                >
                  {tab === "markets" ? t("hub.markets") : tab === "news" ? t("hub.news") : t("hub.mapDevices")}
                </button>
              ))}
            </div>

            {loading && !dash ? (
              <div className="flex justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
              </div>
            ) : (
              <>
                {(activeTab === "markets" || activeTab === "news") && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Panel open title={t("hub.yourTime")} subtitle={timezone}>
                      <p className="text-3xl font-light text-[#00E5FF] tabular-nums">
                        {now.toLocaleTimeString(locale, {
                          timeZone: timezone,
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-[#8A8A8A] mt-1">
                        {now.toLocaleDateString(locale, {
                          timeZone: timezone,
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </Panel>
                    <Panel open title={t("hub.alerts")} subtitle={t("hub.alertsSubtitle", { likes: likes.length, wishlist: wishlist.length })}>
                      <p className="text-xs text-[#8A8A8A]">
                        {useSettingsStore.getState().notificationsEnabled ? t("hub.notificationsOn") : t("hub.notificationsOff")}
                      </p>
                      <p className="text-[10px] text-[#5A5A5A] mt-2">{t("hub.alertsBody")}</p>
                    </Panel>
                    <Panel open title={t("hub.currency")} subtitle={`Base: ${currency}`}>
                      <p className="text-xs text-[#8A8A8A]">{t("hub.currencyHint")}</p>
                    </Panel>
                  </div>
                )}

                {activeTab === "markets" && dash && (
                  <>
                    <Panel open title={t("hub.liveMarkets")} subtitle={t("hub.liveMarketsSubtitle")}>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                          {dash.markets.map((q) => (
                            <QuoteRow
                              key={q.symbol}
                              q={q}
                              active={selected === q.symbol}
                              onSelect={() => setSelected(q.symbol)}
                            />
                          ))}
                        </div>
                        <div>
                          {selectedQuote && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-[#F5F5F5]">
                                {selectedQuote.name} ({selectedQuote.symbol})
                              </p>
                              <p className="text-2xl text-[#00E5FF] tabular-nums mt-1">
                                ${selectedQuote.price.toLocaleString()}
                                <span
                                  className={`ml-2 text-sm ${
                                    selectedQuote.change_percent >= 0 ? "text-[#00C853]" : "text-[#FF5252]"
                                  }`}
                                >
                                  {selectedQuote.change_percent >= 0 ? "+" : ""}
                                  {selectedQuote.change_percent.toFixed(2)}%
                                </span>
                              </p>
                              <p className="text-[10px] text-[#5A5A5A] mt-1">
                                {selectedQuote.exchange} · {selectedQuote.market_state}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-1 mb-2 flex-wrap">
                            {RANGES.map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setRange(r)}
                                className={`px-2 py-1 text-[10px] rounded border ${
                                  range === r
                                    ? "border-[#00E5FF] text-[#00E5FF]"
                                    : "border-[#2A2A2A] text-[#5A5A5A]"
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                          {historyLoading ? (
                            <div className="h-32 flex items-center justify-center">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00E5FF] border-t-transparent" />
                            </div>
                          ) : history ? (
                            <StockChart
                              points={history.points}
                              positive={(history.points.at(-1)?.close ?? 0) >= (history.points[0]?.close ?? 0)}
                            />
                          ) : null}
                        </div>
                      </div>
                    </Panel>

                    <Panel open title={t("hub.history")} subtitle="Recently viewed symbols">
                      <div className="flex flex-wrap gap-2">
                        {hubHistory.length === 0 && (
                          <p className="text-xs text-[#5A5A5A]">{t("hub.historyHint")}</p>
                        )}
                        {hubHistory.map((h) => (
                          <button
                            key={h.symbol}
                            type="button"
                            onClick={() => setSelected(h.symbol)}
                            className="px-3 py-1.5 text-xs rounded-full border border-[#2A2A2A] text-[#8A8A8A] hover:border-[#00E5FF]/40 hover:text-[#00E5FF]"
                          >
                            {h.symbol}
                            <span className="ml-1 text-[#5A5A5A]">
                              {new Date(h.viewedAt).toLocaleDateString(locale, { month: "short", day: "numeric" })}
                            </span>
                          </button>
                        ))}
                      </div>
                    </Panel>
                  </>
                )}

                {activeTab === "news" && dash && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Panel open title={t("hub.trending")} subtitle={t("hub.trendingSubtitle")}>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {dash.trending.map((t) => (
                          <button
                            key={t.symbol}
                            type="button"
                            onClick={() => {
                              setSelected(t.symbol);
                              setActiveTab("markets");
                            }}
                            className="w-full flex items-center justify-between rounded-lg border border-[#1F1F1F] px-3 py-2 hover:border-[#00E5FF]/30 text-left"
                          >
                            <div>
                              <p className="text-xs font-medium text-[#F5F5F5]">{t.symbol}</p>
                              <p className="text-[10px] text-[#5A5A5A]">{t.name}</p>
                            </div>
                            <div className="text-right">
                              {t.price != null && (
                                <p className="text-xs text-[#F5F5F5] tabular-nums">${t.price.toFixed(2)}</p>
                              )}
                              {t.change_percent != null && (
                                <p
                                  className={`text-[10px] tabular-nums ${
                                    t.change_percent >= 0 ? "text-[#00C853]" : "text-[#FF5252]"
                                  }`}
                                >
                                  {t.change_percent >= 0 ? "+" : ""}
                                  {t.change_percent.toFixed(2)}%
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </Panel>

                    <Panel open title={t("hub.newsFeed")} subtitle={t("hub.newsFeedSubtitle")}>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {dash.news.map((n) => (
                          <InAppLink
                            key={n.id}
                            href={n.link}
                            className="block w-full text-left rounded-lg border border-[#1F1F1F] px-3 py-2.5 hover:border-[#7C4DFF]/30 transition-colors"
                          >
                            <p className="text-xs text-[#F5F5F5] leading-relaxed">{n.title}</p>
                            <p className="text-[10px] text-[#5A5A5A] mt-1">
                              {n.publisher}
                              {n.published_at
                                ? ` · ${new Date(n.published_at * 1000).toLocaleString(locale)}`
                                : ""}
                              <span className="ml-2 text-[#7C4DFF]">{t("hub.readInApp")}</span>
                            </p>
                            {n.related_tickers.length > 0 && (
                              <p className="text-[9px] text-[#00E5FF] mt-1">
                                {n.related_tickers.join(" · ")}
                              </p>
                            )}
                          </InAppLink>
                        ))}
                      </div>
                    </Panel>
                  </div>
                )}

                {activeTab === "map" && dash && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Panel open title={t("hub.googleMaps")} subtitle={t("hub.googleMapsSubtitle")}>
                      <GoogleMapExplorer promotedPlaces={dash.promoted_places || []} />
                      <Link
                        href="/map"
                        className="mt-3 inline-block text-xs text-[#00E5FF] hover:underline"
                      >
                        {t("hub.openMap")}
                      </Link>
                      <div className="mt-3 space-y-2">
                        {dash.events.map((e) => (
                          <Link
                            key={e.id}
                            href={`/map?lat=${e.lat}&lng=${e.lng}&name=${encodeURIComponent(e.title)}&navigate=1`}
                            className="flex items-center justify-between text-xs border-b border-[#1F1F1F] pb-2 hover:text-[#00E5FF]"
                          >
                            <span className="text-[#F5F5F5]">{e.title}</span>
                            <span className="text-[#5A5A5A]">
                              {e.city} · <span className="text-[#00E5FF]">{e.status}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                      {(dash.promoted_places || []).length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#1F1F1F]">
                          <p className="text-[10px] uppercase text-[#5A5A5A] mb-2">{t("hub.promotedFromFeed")}</p>
                          {(dash.promoted_places || []).map((p) => (
                            <Link
                              key={p.place_id}
                              href={`/map?lat=${p.lat}&lng=${p.lng}&name=${encodeURIComponent(p.name)}&navigate=1`}
                              className="block text-xs text-[#FFB300] py-1 hover:underline"
                            >
                              {t("hub.promotedBy", { name: p.name, author: p.promoted_by ?? "" })}
                            </Link>
                          ))}
                        </div>
                      )}
                    </Panel>

                    <Panel open title={t("hub.deviceStatus")} subtitle={t("hub.deviceStatusSubtitle")}>
                      <div className="space-y-2">
                        {dash.devices.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center gap-3 rounded-lg border border-[#1F1F1F] px-3 py-2.5"
                          >
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                d.status === "online" || d.status === "representing"
                                  ? "bg-[#00C853] animate-pulse"
                                  : d.status === "standby"
                                    ? "bg-[#FFB300]"
                                    : "bg-[#5A5A5A]"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-[#F5F5F5]">{d.name}</p>
                              <p className="text-[10px] text-[#5A5A5A] truncate">{d.detail}</p>
                            </div>
                            <span className="text-[9px] uppercase text-[#5A5A5A] shrink-0">{d.type}</span>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  </div>
                )}

                <Panel open title={t("hub.worldClocks")}>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {WORLD_CLOCKS.map((c) => (
                      <div key={c.city} className="rounded-lg border border-[#1F1F1F] p-3 text-center">
                        <p className="text-[10px] text-[#5A5A5A] uppercase">{c.city}</p>
                        <p className="text-lg text-[#F5F5F5] tabular-nums mt-1">
                          {now.toLocaleTimeString(locale, {
                            timeZone: c.tz,
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </Panel>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Panel open title={t("hub.forecast")} subtitle={t("hub.forecastSubtitle")}>
                    <div className="flex justify-between gap-1">
                      {WEATHER_7.map((d) => (
                        <div key={d.day} className="flex-1 text-center py-2 rounded border border-[#1F1F1F]">
                          <p className="text-[9px] text-[#5A5A5A]">{d.day}</p>
                          <p className="text-lg my-1">{d.icon}</p>
                          <p className="text-[10px] text-[#F5F5F5]">{d.hi}°</p>
                          <p className="text-[9px] text-[#5A5A5A]">{d.lo}°</p>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel open title={t("hub.calendar")} subtitle={now.toLocaleDateString(locale, { month: "long", year: "numeric" })}>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                        <span key={`cal-hdr-${i}`} className="text-[#5A5A5A] py-1">{d}</span>
                      ))}
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <span key={`e-${i}`} />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const isToday = day === now.getDate();
                        return (
                          <span
                            key={day}
                            className={`py-1 rounded ${isToday ? "bg-[#00E5FF]/20 text-[#00E5FF]" : "text-[#8A8A8A]"}`}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </Panel>
                </div>
              </>
            )}
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}