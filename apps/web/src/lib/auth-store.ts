"use client";

import type { AuthSession, PostSector, UserMode } from "@nexus/types";
import { normalizeSector } from "@/lib/sectors";
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
  setActiveSector: (sector: PostSector) => void;
  /** @deprecated use setActiveSector */
  setViewContext: (sector: PostSector) => void;
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
            viewContext: normalizeSector(session.viewContext),
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
      setActiveSector: (sector) =>
        set((state) =>
          state.session ? { session: { ...state.session, viewContext: normalizeSector(sector) } } : state
        ),
      setViewContext: (sector) =>
        set((state) =>
          state.session ? { session: { ...state.session, viewContext: normalizeSector(sector) } } : state
        ),
      setFeedType: (feedType) => set({ feedType }),
      clearSession: () => set({ session: null, feedType: "global" }),
    }),
    {
      name: "nexsocio-auth",
      partialize: (state) => ({ session: state.session, feedType: state.feedType }),
      onRehydrateStorage: () => (state) => {
        if (state?.session?.viewContext) {
          state.session.viewContext = normalizeSector(state.session.viewContext);
        }
        state?.setHasHydrated(true);
      },
    }
  )
);