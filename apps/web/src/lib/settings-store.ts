"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ACCENT, type AccentPresetId, type ThemeMode } from "./theme";

export type ProfileVisibility = "public" | "connections" | "private";

export interface UserSettings {
  themeMode: ThemeMode;
  accentColor: string;
  accentPreset: AccentPresetId;
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
  hubHistory: { symbol: string; viewedAt: string }[];
  profileVisibility: ProfileVisibility;
  showProfileViewers: boolean;
  shareAnalytics: boolean;
  personalizedAds: boolean;
  offlineDownloads: boolean;
  wifiOnlyDownloads: boolean;
  connectors: Record<string, boolean>;
  stripeConnected: boolean;
  paypalConnected: boolean;
  bonusCoins: number;
  scheduledPosts: { id: string; body: string; at: string }[];
  findMeEnabled: boolean;
  shareLocationWithFollowers: boolean;
  showLiveLocationTag: boolean;
  trackLoginLocation: boolean;
  profileMediaUrl: string | null;
  businessMediaUrl: string | null;
}

interface SettingsState extends UserSettings {
  addNote: (text: string) => void;
  addWishlist: (item: string) => void;
  toggleLike: (postId: string) => void;
  addHubHistory: (symbol: string) => void;
  toggleConnector: (id: string) => void;
  addScheduledPost: (body: string, at: string) => void;
  update: (partial: Partial<UserSettings>) => void;
}

const defaults: UserSettings = {
  themeMode: "dark",
  accentColor: DEFAULT_ACCENT,
  accentPreset: "cyan",
  voiceControlEnabled: false,
  ephemeralNav: true,
  locale: "en",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  currency: "GBP",
  notificationsEnabled: true,
  commentModeration: true,
  twinAutoActivate: false,
  notes: [],
  wishlist: [],
  likes: [],
  hubHistory: [],
  profileVisibility: "connections",
  showProfileViewers: true,
  shareAnalytics: true,
  personalizedAds: false,
  offlineDownloads: true,
  wifiOnlyDownloads: true,
  connectors: {},
  stripeConnected: false,
  paypalConnected: false,
  bonusCoins: 120,
  scheduledPosts: [],
  findMeEnabled: false,
  shareLocationWithFollowers: false,
  showLiveLocationTag: true,
  trackLoginLocation: true,
  profileMediaUrl: null,
  businessMediaUrl: null,
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
      addHubHistory: (symbol) => {
        const entry = { symbol, viewedAt: new Date().toISOString() };
        const hubHistory = [
          entry,
          ...get().hubHistory.filter((h) => h.symbol !== symbol),
        ].slice(0, 20);
        set({ hubHistory });
      },
      toggleConnector: (id) => {
        const c = get().connectors;
        set({ connectors: { ...c, [id]: !c[id] } });
      },
      addScheduledPost: (body, at) => {
        const post = { id: `sched-${Date.now()}`, body, at };
        set({ scheduledPosts: [post, ...get().scheduledPosts].slice(0, 30) });
      },
      update: (partial) => set(partial),
    }),
    {
      name: "nexsocio-settings",
      partialize: (s) => ({
        themeMode: s.themeMode,
        accentColor: s.accentColor,
        accentPreset: s.accentPreset,
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
        hubHistory: s.hubHistory,
        profileVisibility: s.profileVisibility,
        showProfileViewers: s.showProfileViewers,
        shareAnalytics: s.shareAnalytics,
        personalizedAds: s.personalizedAds,
        offlineDownloads: s.offlineDownloads,
        wifiOnlyDownloads: s.wifiOnlyDownloads,
        connectors: s.connectors,
        stripeConnected: s.stripeConnected,
        paypalConnected: s.paypalConnected,
        bonusCoins: s.bonusCoins,
        scheduledPosts: s.scheduledPosts,
        findMeEnabled: s.findMeEnabled,
        shareLocationWithFollowers: s.shareLocationWithFollowers,
        showLiveLocationTag: s.showLiveLocationTag,
        trackLoginLocation: s.trackLoginLocation,
        profileMediaUrl: s.profileMediaUrl,
        businessMediaUrl: s.businessMediaUrl,
      }),
    }
  )
);