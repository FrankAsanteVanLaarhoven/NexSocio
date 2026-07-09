"use client";

import { useEffect, useState } from "react";
import type { Contact } from "@nexus/types";
import { listContacts } from "@/lib/api";

interface ContactPickerProps {
  token: string;
  selected: string[];
  onChange: (ids: string[]) => void;
  max?: number;
}

export function ContactPicker({ token, selected, onChange, max = 50 }: ContactPickerProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listContacts(token)
      .then((data) => {
        if (active) setContacts(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
      return;
    }
    if (selected.length >= max) return;
    onChange([...selected, id]);
  }

  if (loading) {
    return <p className="text-xs text-[#5A5A5A]">Loading contacts…</p>;
  }

  if (!contacts.length) {
    return (
      <p className="text-xs text-[#5A5A5A]">
        No contacts yet — connect with members or add manually from Contacts.
      </p>
    );
  }

  return (
    <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-[#2A2A2A] p-2">
      {contacts.map((c) => {
        const checked = selected.includes(c.id);
        return (
          <label
            key={c.id}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer ${
              checked ? "bg-[#00E5FF]/10 text-[#00E5FF]" : "text-[#8A8A8A] hover:bg-[#1A1A1A]"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(c.id)}
              className="accent-[#00E5FF]"
            />
            <span className="flex-1 truncate">{c.display_name}</span>
            <span className="text-[10px] text-[#5A5A5A]">{c.source}</span>
          </label>
        );
      })}
    </div>
  );
}