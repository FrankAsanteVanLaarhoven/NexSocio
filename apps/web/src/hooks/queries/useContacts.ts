"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addContact, listContacts, shareWithContacts } from "@/lib/api";
import { queryKeys } from "./keys";

export function useContacts(token: string | undefined, sync = true) {
  return useQuery({
    queryKey: [...queryKeys.contacts(token), sync] as const,
    queryFn: () => listContacts(token!, sync),
    enabled: !!token,
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
    onSuccess: () => {
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