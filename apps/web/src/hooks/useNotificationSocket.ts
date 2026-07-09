"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { Notification } from "@nexus/types";
import { notificationWsUrl } from "@/lib/api";
import { prependInboxNotification } from "@/hooks/queries/useInbox";

export function useNotificationSocket(token: string | undefined) {
  const queryClient = useQueryClient();
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (!token) return;

    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;
    const accessToken = token;

    function connect() {
      ws = new WebSocket(notificationWsUrl(accessToken));
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type?: string;
            data?: Notification;
          };
          if (payload.type === "notification" && payload.data) {
            prependInboxNotification(queryClient, tokenRef.current, payload.data);
          }
        } catch {
          /* ignore malformed frames */
        }
      };
      ws.onclose = () => {
        if (!closed) {
          retryTimer = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
    };
  }, [token, queryClient]);
}