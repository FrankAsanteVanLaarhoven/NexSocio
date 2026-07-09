"use client";

import { useEffect, useState } from "react";

/** Prevents hydration mismatch from zustand persist / localStorage. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}