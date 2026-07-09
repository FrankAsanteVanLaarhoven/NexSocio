import type { AppIconName } from "@/components/icons/AppIcon";

export type InboxControlGroup = {
  id: string;
  titleKey: string;
  items: {
    id: string;
    labelKey: string;
    descKey?: string;
    href: string;
    icon: AppIconName;
  }[];
};

export const INBOX_CONTROL_GROUPS: InboxControlGroup[] = [
  {
    id: "safety",
    titleKey: "inbox.controls.safety",
    items: [
      { id: "report", labelKey: "inbox.controls.report", href: "/safety", icon: "privacy" },
      { id: "block", labelKey: "inbox.controls.block", href: "/inbox#blocked", icon: "minus" },
      { id: "spam", labelKey: "inbox.controls.spam", href: "/inbox#spam", icon: "minus" },
      { id: "appeal", labelKey: "inbox.controls.appeal", href: "/settings/help", icon: "help" },
      { id: "archives", labelKey: "inbox.controls.archives", href: "/inbox#archives", icon: "download" },
    ],
  },
  {
    id: "social",
    titleKey: "inbox.controls.social",
    items: [
      { id: "mentions", labelKey: "inbox.controls.mentions", href: "/inbox#mentions", icon: "mail" },
      { id: "repost", labelKey: "inbox.controls.repost", href: "/inbox#repost", icon: "share" },
      { id: "collections", labelKey: "inbox.controls.collections", href: "/inbox#collections", icon: "star" },
      { id: "viewers", labelKey: "inbox.controls.viewers", href: "/settings/analytics#viewers", icon: "viewers" },
      { id: "following", labelKey: "inbox.controls.following", href: "/connections", icon: "followers" },
      { id: "share-profile", labelKey: "inbox.controls.shareProfile", href: "/settings/share", icon: "share" },
      { id: "private", labelKey: "inbox.controls.privateAccount", href: "/inbox#privacy", icon: "eye" },
    ],
  },
  {
    id: "content",
    titleKey: "inbox.controls.content",
    items: [
      { id: "preferences", labelKey: "inbox.controls.contentPrefs", href: "/inbox#content-prefs", icon: "stats" },
      { id: "effects", labelKey: "inbox.controls.effects", href: "/studio", icon: "ai" },
      { id: "reuse", labelKey: "inbox.controls.reuse", href: "/inbox#reuse", icon: "upload" },
      { id: "liked-videos", labelKey: "inbox.controls.likedVideos", href: "/inbox#liked", icon: "vlog" },
      { id: "favorite-sounds", labelKey: "inbox.controls.favoriteSounds", href: "/inbox#sounds", icon: "podcast" },
      { id: "music", labelKey: "inbox.controls.music", href: "/studio", icon: "podcast" },
    ],
  },
  {
    id: "wellbeing",
    titleKey: "inbox.controls.wellbeing",
    items: [
      { id: "time", labelKey: "inbox.controls.timeWellbeing", href: "/inbox#wellbeing", icon: "schedule" },
      { id: "family", labelKey: "inbox.controls.familyPairing", href: "/settings/account", icon: "friends" },
      { id: "audience", labelKey: "inbox.controls.audience", href: "/settings/privacy", icon: "eye" },
    ],
  },
  {
    id: "account",
    titleKey: "inbox.controls.account",
    items: [
      { id: "security", labelKey: "inbox.controls.security", href: "/settings/security", icon: "shield" },
      { id: "permissions", labelKey: "inbox.controls.permissions", href: "/settings/privacy", icon: "legal" },
      { id: "switch", labelKey: "inbox.controls.switchAccount", href: "/login", icon: "connect" },
      { id: "applications", labelKey: "inbox.controls.applications", href: "/settings/network", icon: "connectors" },
    ],
  },
  {
    id: "playback",
    titleKey: "inbox.controls.playback",
    items: [
      { id: "display", labelKey: "inbox.controls.display", href: "/settings/account", icon: "prefs" },
      { id: "accessibility", labelKey: "inbox.controls.accessibility", href: "/inbox#accessibility", icon: "help" },
      { id: "offline", labelKey: "inbox.controls.offlineVideos", href: "/settings/media", icon: "download" },
      { id: "free-space", labelKey: "inbox.controls.freeSpace", href: "/settings/media", icon: "cloud" },
      { id: "data-saver", labelKey: "inbox.controls.dataSaver", href: "/inbox#data-saver", icon: "wifi" },
    ],
  },
  {
    id: "monetization",
    titleKey: "inbox.controls.planAds",
    items: [
      { id: "plan", labelKey: "inbox.controls.plan", href: "/settings/monetization", icon: "monetization" },
      { id: "ads", labelKey: "inbox.controls.ads", href: "/settings/privacy#ads", icon: "chart" },
    ],
  },
  {
    id: "support",
    titleKey: "inbox.controls.support",
    items: [
      { id: "help", labelKey: "inbox.controls.helpCenter", href: "/settings/help", icon: "help" },
      { id: "undo", labelKey: "inbox.controls.undo", href: "/inbox#undo", icon: "refund" },
    ],
  },
];