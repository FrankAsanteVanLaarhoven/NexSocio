"use client";

import type { AuthSession, UserMode, ViewContext } from "@nexus/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  session: AuthSession | null;
  feedType: "global" | "connections";
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setSession: (session: AuthSession) => void;
  updateMode: (mode: UserMode, accessToken: string) => void;
  updateDisplayName: (displayName: string) => void;
  setViewContext: (context: ViewContext) => void;
  setFeedType: (feedType: "global" | "connections") => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      feedType: "global",
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      setSession: (session) =>
        set({
          session: {
            ...session,
            viewContext: session.viewContext ?? "personal",
          },
        }),
      updateMode: (mode, accessToken) =>
        set((state) =>
          state.session ? { session: { ...state.session, mode, accessToken } } : state
        ),
      updateDisplayName: (displayName) =>
        set((state) =>
          state.session ? { session: { ...state.session, displayName } } : state
        ),
      setViewContext: (viewContext) =>
        set((state) => (state.session ? { session: { ...state.session, viewContext } } : state)),
      setFeedType: (feedType) => set({ feedType }),
      clearSession: () => set({ session: null, feedType: "global" }),
    }),
    {
      name: "nexsocio-auth",
      partialize: (state) => ({ session: state.session, feedType: state.feedType }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);