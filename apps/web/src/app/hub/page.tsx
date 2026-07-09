"use client";

import { Panel } from "@nexus/ui";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { useSettingsStore } from "@/lib/settings-store";
import { useAuthStore } from "@/lib/auth-store";

const WORLD_CLOCKS = [
  { city: "London", tz: "Europe/London" },
  { city: "New York", tz: "America/New_York" },
  { city: "Tokyo", tz: "Asia/Tokyo" },
  { city: "Lagos", tz: "Africa/Lagos" },
  { city: "Sydney", tz: "Australia/Sydney" },
];

const RATES: Record<string, number> = { GBP: 1, USD: 1.27, EUR: 1.17, JPY: 199, NGN: 1950, GHS: 15.8 };

const WEATHER_7 = [
  { day: "Today", hi: 18, lo: 11, icon: "⛅" },
  { day: "Fri", hi: 20, lo: 12, icon: "🌤" },
  { day: "Sat", hi: 22, lo: 14, icon: "☀️" },
  { day: "Sun", hi: 19, lo: 13, icon: "🌧" },
  { day: "Mon", hi: 17, lo: 10, icon: "⛅" },
  { day: "Tue", hi: 16, lo: 9, icon: "🌦" },
  { day: "Wed", hi: 18, lo: 11, icon: "☀️" },
];

export default function HubPage() {
  const session = useAuthStore((s) => s.session);
  const { timezone, currency, locale, likes, wishlist } = useSettingsStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-4xl space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Hub</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">
                World clocks · weather · calendar · currency · alerts
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Panel open title="Your Time" subtitle={timezone}>
                <p className="text-3xl font-light text-[#00E5FF] tabular-nums">
                  {now.toLocaleTimeString(locale, { timeZone: timezone, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
                <p className="text-xs text-[#8A8A8A] mt-1">
                  {now.toLocaleDateString(locale, { timeZone: timezone, weekday: "long", month: "long", day: "numeric" })}
                </p>
              </Panel>

              <Panel open title="Currency" subtitle={`Base: ${currency}`}>
                <div className="space-y-1">
                  {Object.entries(RATES)
                    .filter(([c]) => c !== currency)
                    .slice(0, 4)
                    .map(([c, r]) => (
                      <p key={c} className="text-xs text-[#8A8A8A]">
                        1 {currency} = {(RATES[currency] ? r / RATES[currency] : r).toFixed(2)} {c}
                      </p>
                    ))}
                </div>
              </Panel>

              <Panel open title="Alerts" subtitle={`${likes.length} likes · ${wishlist.length} wishlist`}>
                <p className="text-xs text-[#8A8A8A]">Notifications {useSettingsStore.getState().notificationsEnabled ? "on" : "off"}</p>
                <p className="text-[10px] text-[#5A5A5A] mt-2">Promote · mentions · twin messages</p>
              </Panel>
            </div>

            <Panel open title="World Clocks">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {WORLD_CLOCKS.map((c) => (
                  <div key={c.city} className="rounded-lg border border-[#1F1F1F] p-3 text-center">
                    <p className="text-[10px] text-[#5A5A5A] uppercase">{c.city}</p>
                    <p className="text-lg text-[#F5F5F5] tabular-nums mt-1">
                      {now.toLocaleTimeString(locale, { timeZone: c.tz, hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2">
              <Panel open title="7-Day Forecast" subtitle="Local stub — OpenWeather in production">
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

              <Panel open title="Calendar" subtitle={now.toLocaleDateString(locale, { month: "long", year: "numeric" })}>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                    <span key={d} className="text-[#5A5A5A] py-1">{d}</span>
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
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}