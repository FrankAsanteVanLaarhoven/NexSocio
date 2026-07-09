"use client";

import { useEffect, useRef } from "react";
import type { Notification } from "@nexus/types";
import { notificationWsUrl } from "@/lib/api";

type NotificationHandler = (notification: Notification) => void;

export function useNotificationSocket(
  token: string | undefined,
  onNotification: NotificationHandler
) {
  const handlerRef = useRef(onNotification);
  handlerRef.current = onNotification;

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
            handlerRef.current(payload.data);
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
  }, [token]);
}