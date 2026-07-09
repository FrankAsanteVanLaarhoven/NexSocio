"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserSettings {
  voiceControlEnabled: boolean;
  ephemeralNav: boolean;
  locale: string;
  timezone: string;
  currency: string;
  notificationsEnabled: boolean;
  commentModeration: boolean;
  twinAutoActivate: boolean;
  notes: string[];
  wishlist: string[];
  likes: string[];
}

interface SettingsState extends UserSettings {
  addNote: (text: string) => void;
  addWishlist: (item: string) => void;
  toggleLike: (postId: string) => void;
  update: (partial: Partial<UserSettings>) => void;
}

const defaults: UserSettings = {
  voiceControlEnabled: false,
  ephemeralNav: true,
  locale: "en-GB",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  currency: "GBP",
  notificationsEnabled: true,
  commentModeration: true,
  twinAutoActivate: false,
  notes: [],
  wishlist: [],
  likes: [],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaults,
      addNote: (text) => set({ notes: [text, ...get().notes].slice(0, 50) }),
      addWishlist: (item) => set({ wishlist: [item, ...get().wishlist].slice(0, 50) }),
      toggleLike: (postId) => {
        const likes = get().likes;
        set({
          likes: likes.includes(postId)
            ? likes.filter((id) => id !== postId)
            : [postId, ...likes],
        });
      },
      update: (partial) => set(partial),
    }),
    {
      name: "nexsocio-settings",
      partialize: (s) => ({
        voiceControlEnabled: s.voiceControlEnabled,
        ephemeralNav: s.ephemeralNav,
        locale: s.locale,
        timezone: s.timezone,
        currency: s.currency,
        notificationsEnabled: s.notificationsEnabled,
        commentModeration: s.commentModeration,
        twinAutoActivate: s.twinAutoActivate,
        notes: s.notes,
        wishlist: s.wishlist,
        likes: s.likes,
      }),
    }
  )
);