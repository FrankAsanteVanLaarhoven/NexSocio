"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InboxSummary, Notification } from "@nexus/types";
import { getInbox, markNotificationRead } from "@/lib/api";
import { queryKeys } from "./keys";

export function useInbox(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.inbox(token),
    queryFn: () => getInbox(token!),
    enabled: !!token,
  });
}

export function useMarkNotificationRead(token: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(token!, notificationId),
    onSuccess: (updated: Notification) => {
      queryClient.setQueryData<InboxSummary>(queryKeys.inbox(token), (old) => {
        if (!old) return old;
        const wasUnread = old.notifications.find((n) => n.id === updated.id && !n.read);
        return {
          unread_count: Math.max(0, old.unread_count - (wasUnread ? 1 : 0)),
          notifications: old.notifications.map((n) =>
            n.id === updated.id ? updated : n
          ),
        };
      });
    },
  });
}

export function prependInboxNotification(
  queryClient: ReturnType<typeof useQueryClient>,
  token: string | undefined,
  notification: Notification
) {
  queryClient.setQueryData<InboxSummary>(queryKeys.inbox(token), (old) => {
    if (!old) {
      return {
        unread_count: notification.read ? 0 : 1,
        notifications: [notification],
      };
    }
    const exists = old.notifications.some((n) => n.id === notification.id);
    if (exists) return old;
    return {
      unread_count: old.unread_count + (notification.read ? 0 : 1),
      notifications: [notification, ...old.notifications],
    };
  });
}