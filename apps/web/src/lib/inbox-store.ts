"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ViewedProfile {
  userId: string;
  displayName: string;
  viewedAt: string;
  avatarUrl?: string | null;
}

export interface FavoriteFollow {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  hasStatus?: boolean;
}

export interface LikedMedia {
  id: string;
  title: string;
  type: "video" | "reel" | "sound";
  likedAt: string;
  thumbnailUrl?: string | null;
}

export interface InboxPreferences {
  privateAccount: boolean;
  mentionsEnabled: boolean;
  reuseContentAllowed: boolean;
  dataSaver: boolean;
  offlineVideos: boolean;
  playbackAutoplay: boolean;
  displayReduceMotion: boolean;
  accessibilityCaptions: boolean;
  timeWellbeingReminders: boolean;
  familyPairingEnabled: boolean;
  audienceControlStrict: boolean;
  personalizedAds: boolean;
}

interface InboxState {
  archivedIds: string[];
  blockedUserIds: string[];
  spamIds: string[];
  recentlyViewed: ViewedProfile[];
  favoriteFollows: FavoriteFollow[];
  likedVideos: LikedMedia[];
  favoriteSounds: LikedMedia[];
  collections: { id: string; name: string; itemIds: string[] }[];
  undoStack: { action: string; payload: unknown; at: string }[];
  preferences: InboxPreferences;
  addRecentlyViewed: (profile: ViewedProfile) => void;
  toggleFavoriteFollow: (follow: FavoriteFollow) => void;
  archiveNotification: (id: string) => void;
  blockUser: (userId: string) => void;
  markSpam: (id: string) => void;
  addLikedVideo: (item: LikedMedia) => void;
  addFavoriteSound: (item: LikedMedia) => void;
  pushUndo: (action: string, payload: unknown) => void;
  popUndo: () => void;
  updatePreferences: (partial: Partial<InboxPreferences>) => void;
}

const defaultPrefs: InboxPreferences = {
  privateAccount: false,
  mentionsEnabled: true,
  reuseContentAllowed: true,
  dataSaver: false,
  offlineVideos: true,
  playbackAutoplay: true,
  displayReduceMotion: false,
  accessibilityCaptions: true,
  timeWellbeingReminders: false,
  familyPairingEnabled: false,
  audienceControlStrict: false,
  personalizedAds: false,
};

export const useInboxStore = create<InboxState>()(
  persist(
    (set, get) => ({
      archivedIds: [],
      blockedUserIds: [],
      spamIds: [],
      recentlyViewed: [],
      favoriteFollows: [],
      likedVideos: [],
      favoriteSounds: [],
      collections: [],
      undoStack: [],
      preferences: defaultPrefs,
      addRecentlyViewed: (profile) =>
        set({
          recentlyViewed: [
            profile,
            ...get().recentlyViewed.filter((p) => p.userId !== profile.userId),
          ].slice(0, 30),
        }),
      toggleFavoriteFollow: (follow) => {
        const list = get().favoriteFollows;
        const exists = list.some((f) => f.userId === follow.userId);
        set({
          favoriteFollows: exists
            ? list.filter((f) => f.userId !== follow.userId)
            : [...list, follow].slice(0, 50),
        });
      },
      archiveNotification: (id) =>
        set({ archivedIds: [...new Set([...get().archivedIds, id])] }),
      blockUser: (userId) =>
        set({ blockedUserIds: [...new Set([...get().blockedUserIds, userId])] }),
      markSpam: (id) =>
        set({ spamIds: [...new Set([...get().spamIds, id])] }),
      addLikedVideo: (item) =>
        set({
          likedVideos: [item, ...get().likedVideos.filter((v) => v.id !== item.id)].slice(0, 100),
        }),
      addFavoriteSound: (item) =>
        set({
          favoriteSounds: [item, ...get().favoriteSounds.filter((s) => s.id !== item.id)].slice(0, 100),
        }),
      pushUndo: (action, payload) =>
        set({
          undoStack: [{ action, payload, at: new Date().toISOString() }, ...get().undoStack].slice(0, 20),
        }),
      popUndo: () => set({ undoStack: get().undoStack.slice(1) }),
      updatePreferences: (partial) =>
        set({ preferences: { ...get().preferences, ...partial } }),
    }),
    { name: "nexsocio-inbox" }
  )
);