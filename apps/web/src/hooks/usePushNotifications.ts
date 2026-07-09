"use client";

import { useCallback, useEffect, useState } from "react";
import { getVapidPublicKey, subscribePush } from "@/lib/api";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function usePushNotifications(token: string | undefined) {
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async () => {
    if (!token || typeof window === "undefined") return;
    setError(null);

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setError("Push not supported in this browser");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = await getVapidPublicKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await subscribePush(token, sub);
      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Push subscribe failed");
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    navigator.serviceWorker?.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSubscribed(false));
  }, [token]);

  return { subscribed, error, subscribe };
}