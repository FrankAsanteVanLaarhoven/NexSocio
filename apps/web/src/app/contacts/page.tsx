"use client";

import { Button, Input, Panel } from "@nexus/ui";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { ContactPicker } from "@/components/ContactPicker";
import { addContact, listContacts, shareWithContacts } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Contact } from "@nexus/types";

export default function ContactsPage() {
  const session = useAuthStore((s) => s.session);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await listContacts(session.accessToken, true);
      setContacts(data);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    if (!session || !name.trim()) return;
    setAdding(true);
    try {
      await addContact(session.accessToken, {
        display_name: name.trim(),
        email: email.trim() || undefined,
      });
      setName("");
      setEmail("");
      await load();
    } finally {
      setAdding(false);
    }
  }

  async function handleShare() {
    if (!session || !shareMsg.trim() || selected.length === 0) return;
    setSharing(true);
    setMsg(null);
    try {
      const result = await shareWithContacts(session.accessToken, {
        content_type: "update",
        message: shareMsg.trim(),
        contact_ids: selected,
      });
      setMsg(`Shared with ${result.shared_count} contact(s).`);
      setShareMsg("");
      setSelected([]);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Share failed");
    } finally {
      setSharing(false);
    }
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <div className="mx-auto max-w-lg space-y-5">
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Contacts</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">Sync connections · share with selection</p>
            </div>

            <Panel open title="Add contact">
              <div className="space-y-3">
                <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button className="w-full" loading={adding} disabled={!name.trim()} onClick={handleAdd}>
                  Add contact
                </Button>
              </div>
            </Panel>

            <Panel open title={`All contacts (${contacts.length})`}>
              {loading ? (
                <p className="text-xs text-[#5A5A5A]">Syncing…</p>
              ) : contacts.length === 0 ? (
                <p className="text-xs text-[#5A5A5A]">No contacts — add one or connect with members.</p>
              ) : (
                <div className="space-y-1">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between py-2 border-b border-[#1F1F1F] text-xs"
                    >
                      <span className="text-[#F5F5F5]">{c.display_name}</span>
                      <span className="text-[#5A5A5A]">{c.source}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel open title="Share with contacts">
              <div className="space-y-3">
                <Input
                  label="Message"
                  value={shareMsg}
                  onChange={(e) => setShareMsg(e.target.value)}
                  placeholder="Check out this update…"
                />
                <ContactPicker
                  token={session.accessToken}
                  selected={selected}
                  onChange={setSelected}
                />
                <Button
                  className="w-full"
                  loading={sharing}
                  disabled={!shareMsg.trim() || selected.length === 0}
                  onClick={handleShare}
                >
                  Share ({selected.length} selected)
                </Button>
                {msg && <p className="text-xs text-[#00C853]">{msg}</p>}
              </div>
            </Panel>
          </div>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}