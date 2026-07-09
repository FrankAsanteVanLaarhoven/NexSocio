"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Contact } from "@nexus/types";
import { addContact, listContacts, shareWithContacts } from "@/lib/api";
import { queryKeys } from "./keys";

export function useContacts(token: string | undefined, sync = true) {
  return useQuery({
    queryKey: [...queryKeys.contacts(token), sync] as const,
    queryFn: () => listContacts(token!, sync),
    enabled: !!token,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useAddContact(token: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      display_name: string;
      email?: string;
      phone?: string;
      contact_user_id?: string;
    }) => addContact(token!, data),
    onSuccess: (contact) => {
      queryClient.setQueryData<Contact[]>(
        [...queryKeys.contacts(token), true],
        (old) => {
          const list = old ?? [];
          if (list.some((c) => c.id === contact.id)) return list;
          return [...list, contact].sort((a, b) =>
            a.display_name.localeCompare(b.display_name)
          );
        }
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts(token) });
    },
  });
}

export function useShareWithContacts(token: string | undefined) {
  return useMutation({
    mutationFn: (data: {
      content_type: "post" | "status" | "meeting" | "product" | "update";
      content_id?: string;
      message: string;
      contact_ids: string[];
    }) => shareWithContacts(token!, data),
  });
}