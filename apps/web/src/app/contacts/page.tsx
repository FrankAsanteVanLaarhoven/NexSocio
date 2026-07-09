"use client";

import { useState } from "react";
import { Button, FadeIn, Input, Panel } from "@nexus/ui";
import { AppShell } from "@/components/AppShell";
import { AuthHydrationGate } from "@/components/AuthHydrationGate";
import { LoginGateway } from "@/components/auth/LoginGateway";
import { ContactPicker } from "@/components/ContactPicker";
import { useAddContact, useContacts, useShareWithContacts } from "@/hooks/queries/useContacts";
import { useAuthStore } from "@/lib/auth-store";

export default function ContactsPage() {
  const session = useAuthStore((s) => s.session);
  const token = session?.accessToken;
  const { data: contacts = [], isLoading } = useContacts(token, true);
  const addContact = useAddContact(token);
  const share = useShareWithContacts(token);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim()) return;
    await addContact.mutateAsync({
      display_name: name.trim(),
      email: email.trim() || undefined,
    });
    setName("");
    setEmail("");
  }

  async function handleShare() {
    if (!shareMsg.trim() || selected.length === 0) return;
    setMsg(null);
    try {
      const result = await share.mutateAsync({
        content_type: "update",
        message: shareMsg.trim(),
        contact_ids: selected,
      });
      setMsg(`Shared with ${result.shared_count} contact(s).`);
      setShareMsg("");
      setSelected([]);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Share failed");
    }
  }

  return (
    <AppShell>
      <AuthHydrationGate>
        {!session ? (
          <LoginGateway />
        ) : (
          <FadeIn className="mx-auto max-w-lg space-y-5">
            <div>
              <h1 className="text-xl font-semibold text-[#F5F5F5]">Contacts</h1>
              <p className="text-xs text-[#8A8A8A] mt-1">Sync connections · share with selection</p>
            </div>

            <Panel open title="Add contact">
              <div className="space-y-3">
                <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button
                  className="w-full"
                  loading={addContact.isPending}
                  disabled={!name.trim()}
                  onClick={handleAdd}
                >
                  Add contact
                </Button>
              </div>
            </Panel>

            <Panel open title={`All contacts (${contacts.length})`}>
              {isLoading ? (
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
                {token && (
                  <ContactPicker token={token} selected={selected} onChange={setSelected} />
                )}
                <Button
                  className="w-full"
                  loading={share.isPending}
                  disabled={!shareMsg.trim() || selected.length === 0}
                  onClick={handleShare}
                >
                  Share ({selected.length} selected)
                </Button>
                {msg && <p className="text-xs text-[#00C853]">{msg}</p>}
              </div>
            </Panel>
          </FadeIn>
        )}
      </AuthHydrationGate>
    </AppShell>
  );
}