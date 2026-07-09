"use client";

import { useLocationTracker } from "@/hooks/useLocationTracker";

export function LocationTracker() {
  useLocationTracker(false);
  return null;
}