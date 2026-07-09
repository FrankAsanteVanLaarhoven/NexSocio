"use client";

import { useState } from "react";
import { Button, Input, Panel } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { SecuritySetup } from "@/components/auth/SecuritySetup";
import { useSettingsStore } from "@/lib/settings-store";
import { useAuthStore } from "@/lib/auth-store";

const LOCALES = [
  { id: "en-GB", label: "English (UK)" },
  { id: "en-US", label: "English (US)" },
  { id: "fr-FR", label: "Français" },
  { id: "de-DE", label: "Deutsch" },
  { id: "es-ES", label: "Español" },
  { id: "ja-JP", label: "日本語" },
];

const CURRENCIES = ["GBP", "USD", "EUR", "JPY", "NGN", "GHS"];

export default function SettingsPage() {
  const session = useAuthStore((s) => s.session);
  const s = useSettingsStore();
  const [note, setNote] = useState("");
  const [wish, setWish] = useState("");

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Settings</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">Voice · UI · locale · notifications</p>
            </div>

            <Panel open title="NEXSOCIO AI" subtitle="Compose & video tagging">
              <p className="text-xs text-[#8A8A8A] leading-relaxed">
                AI-assisted posts show a <span className="text-[#7C4DFF]">NEXSOCIO AI</span> badge for
                transparency. Premium and Business users can hide the tag when publishing ads or branded
                content. Founding members get Premium; Professional mode unlocks Business.
              </p>
            </Panel>

            <Panel open title="Voice Control" subtitle="Alexa / Siri-class device control">
              <div className="space-y-3">
                <Toggle
                  label="Enable voice commands everywhere"
                  hint={'Say "open twin", "I\'m busy", "what happened", "post hello world"'}
                  on={s.voiceControlEnabled}
                  onChange={(v) => s.update({ voiceControlEnabled: v })}
                />
                <Toggle
                  label="Ephemeral navigation"
                  hint="Nav reveals on scroll or cursor near top"
                  on={s.ephemeralNav}
                  onChange={(v) => s.update({ ephemeralNav: v })}
                />
                <Toggle
                  label="Comment moderation"
                  hint="Comments reviewed before appearing (posts publish direct)"
                  on={s.commentModeration}
                  onChange={(v) => s.update({ commentModeration: v })}
                />
                <Toggle
                  label="Notifications"
                  on={s.notificationsEnabled}
                  onChange={(v) => s.update({ notificationsEnabled: v })}
                />
              </div>
            </Panel>

            <Panel open title="Localization">
              <div className="space-y-3">
                <label className="text-xs text-[#8A8A8A] uppercase tracking-wider">Language</label>
                <select
                  value={s.locale}
                  onChange={(e) => s.update({ locale: e.target.value })}
                  className="w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
                >
                  {LOCALES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <Input
                  label="Timezone"
                  value={s.timezone}
                  onChange={(e) => s.update({ timezone: e.target.value })}
                />
                <label className="text-xs text-[#8A8A8A] uppercase tracking-wider">Currency</label>
                <select
                  value={s.currency}
                  onChange={(e) => s.update({ currency: e.target.value })}
                  className="w-full rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#F5F5F5]"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </Panel>

            <Panel open title="Quick Notes">
              <div className="flex gap-2 mb-3">
                <Input className="flex-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add note..." />
                <Button size="sm" onClick={() => { if (note.trim()) { s.addNote(note.trim()); setNote(""); } }}>
                  Add
                </Button>
              </div>
              {s.notes.slice(0, 5).map((n, i) => (
                <p key={i} className="text-xs text-[#8A8A8A] border-b border-[#1F1F1F] py-1.5">{n}</p>
              ))}
            </Panel>

            <Panel open title="Wishlist">
              <div className="flex gap-2 mb-3">
                <Input className="flex-1" value={wish} onChange={(e) => setWish(e.target.value)} placeholder="Add to wishlist..." />
                <Button size="sm" onClick={() => { if (wish.trim()) { s.addWishlist(wish.trim()); setWish(""); } }}>
                  Add
                </Button>
              </div>
              {s.wishlist.slice(0, 5).map((w, i) => (
                <p key={i} className="text-xs text-[#8A8A8A]">♡ {w}</p>
              ))}
            </Panel>

            <SecuritySetup />
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between rounded-lg border border-[#2A2A2A] px-4 py-3 text-left hover:border-[#3A3A3A] transition-colors"
    >
      <div>
        <p className="text-sm text-[#F5F5F5]">{label}</p>
        {hint && <p className="text-[10px] text-[#5A5A5A] mt-0.5">{hint}</p>}
      </div>
      <div className={`h-5 w-9 rounded-full transition-colors ${on ? "bg-[#00E5FF]" : "bg-[#2A2A2A]"}`}>
        <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0"}`} />
      </div>
    </button>
  );
}