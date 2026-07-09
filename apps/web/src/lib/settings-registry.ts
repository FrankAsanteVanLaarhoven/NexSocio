export type SettingsSector = "personal" | "professional" | "both";

export interface SettingsItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  sector: SettingsSector;
  icon?: string;
  badge?: string;
}

export interface SettingsGroup {
  id: string;
  title: string;
  subtitle?: string;
  sector: SettingsSector;
  items: SettingsItem[];
}

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: "security",
    title: "Sign-in & Security",
    subtitle: "Account protection",
    sector: "both",
    items: [
      { id: "auth-methods", label: "Sign-in methods", description: "Password, PIN, biometrics, WebAuthn", href: "/settings/security", sector: "both", icon: "🔐" },
      { id: "sessions", label: "Active sessions", description: "Devices signed into your account", href: "/settings/security#sessions", sector: "both", icon: "📱" },
      { id: "remote-access", label: "Remote access", description: "Approve trusted devices", href: "/settings/connectivity", sector: "both", icon: "🛰" },
    ],
  },
  {
    id: "account",
    title: "Account Preferences",
    subtitle: "Language, timezone, notifications",
    sector: "both",
    items: [
      { id: "prefs", label: "General preferences", href: "/settings/account", sector: "both", icon: "⚙" },
      { id: "inbox", label: "Inbox", description: "Live notifications & mentions", href: "/inbox", sector: "both", icon: "✉" },
      { id: "help", label: "Help & feedback", href: "/settings/help", sector: "both", icon: "💬" },
    ],
  },
  {
    id: "privacy",
    title: "Privacy & Visibility",
    sector: "both",
    items: [
      { id: "data-privacy", label: "Data privacy", description: "Export, delete, consent", href: "/settings/privacy", sector: "both", icon: "🛡" },
      { id: "visibility", label: "Profile visibility", description: "Who can see you", href: "/settings/privacy#visibility", sector: "both", icon: "👁" },
      { id: "advertising-data", label: "Advertising data", description: "Ad preferences & opt-out", href: "/settings/privacy#ads", sector: "both", icon: "📊" },
    ],
  },
  {
    id: "social-personal",
    title: "Social & Friends",
    sector: "personal",
    items: [
      { id: "friends", label: "Friends", href: "/connections", sector: "personal", icon: "👥" },
      { id: "followers", label: "Followers & following", href: "/settings/network#followers", sector: "personal", icon: "↔" },
      { id: "groups", label: "Groups", href: "/settings/groups", sector: "personal", icon: "◎" },
      { id: "near-me", label: "Location & near me", href: "/map", sector: "personal", icon: "📍" },
      { id: "find-me", label: "Find Me & safety", description: "Get found if lost", href: "/settings/location", sector: "personal", icon: "🆘" },
      { id: "location-finder", label: "Location finder map", description: "See members live", href: "/find", sector: "personal", icon: "⊕" },
      { id: "share", label: "Share & invites", href: "/settings/share", sector: "personal", icon: "↗" },
    ],
  },
  {
    id: "network-pro",
    title: "Your Network",
    subtitle: "Professional connections & reach",
    sector: "professional",
    items: [
      { id: "network", label: "Your network", href: "/connections", sector: "professional", icon: "◇" },
      { id: "viewers", label: "Who viewed your profile", href: "/settings/analytics#viewers", sector: "professional", icon: "👀" },
      { id: "impressions", label: "Post impressions", href: "/settings/analytics#impressions", sector: "professional", icon: "📈" },
      { id: "connectors", label: "Connectors", description: "Slack, GitHub, LinkedIn, email", href: "/settings/network", sector: "professional", icon: "🔗" },
    ],
  },
  {
    id: "connectors",
    title: "Connectors",
    subtitle: "Link external tools — stay productive",
    sector: "both",
    items: [
      { id: "slack", label: "Slack", href: "/settings/network#slack", sector: "both", icon: "💼" },
      { id: "github", label: "GitHub", href: "/settings/network#github", sector: "both", icon: "⌥" },
      { id: "linkedin", label: "LinkedIn", href: "/settings/network#linkedin", sector: "both", icon: "in" },
      { id: "email", label: "Email accounts", href: "/settings/network#email", sector: "both", icon: "@" },
      { id: "social-connect", label: "Social media accounts", href: "/settings/network#social", sector: "both", icon: "◈" },
    ],
  },
  {
    id: "content",
    title: "Content & Media",
    sector: "both",
    items: [
      { id: "schedule", label: "Schedule posts", href: "/settings/schedule", sector: "both", icon: "🗓" },
      { id: "podcast", label: "Podcast", href: "/studio", sector: "personal", icon: "🎙" },
      { id: "vlog", label: "Vlog", href: "/studio", sector: "personal", icon: "📹" },
      { id: "live", label: "Live streams", href: "/live", sector: "both", icon: "●" },
      { id: "uploads", label: "Media uploads", description: "Video & photo · MP4 · JPG · WebP", href: "/studio", sector: "both", icon: "⬆" },
      { id: "offline", label: "Offline video & downloads", href: "/settings/media", sector: "personal", icon: "⬇" },
    ],
  },
  {
    id: "wallet",
    title: "Wallet & Payments",
    sector: "both",
    items: [
      { id: "wallet", label: "Wallet", href: "/wallet", sector: "both", icon: "💳" },
      { id: "cards", label: "Add account or card", href: "/wallet#cards", sector: "both", icon: "＋" },
      { id: "stripe", label: "Stripe setup", href: "/wallet#stripe", sector: "both", icon: "S" },
      { id: "paypal", label: "PayPal setup", href: "/wallet#paypal", sector: "both", icon: "P" },
      { id: "transactions", label: "Transactions & purchases", href: "/wallet#transactions", sector: "both", icon: "🧾" },
      { id: "payouts", label: "Payouts & refunds", href: "/wallet#payouts", sector: "both", icon: "↩" },
      { id: "crypto", label: "Crypto, tokens & bonus coins", href: "/wallet#crypto", sector: "personal", icon: "◎" },
    ],
  },
  {
    id: "monetization-personal",
    title: "Rewards & Gifts",
    sector: "personal",
    items: [
      { id: "live-rewards", label: "Live rewards", href: "/settings/monetization#live-rewards", sector: "personal", icon: "🎁" },
      { id: "promotions", label: "Promotions & gifts", href: "/settings/monetization#promotions", sector: "personal", icon: "✨" },
      { id: "bonus-coins", label: "Bonus coins & airdrops", href: "/wallet#crypto", sector: "personal", icon: "🪙" },
      { id: "subscriptions-personal", label: "Subscriptions", href: "/settings/monetization#subscriptions", sector: "personal", icon: "★" },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace",
    subtitle: "Buy · sell · wallet checkout",
    sector: "both",
    items: [
      { id: "marketplace", label: "Browse marketplace", href: "/marketplace", sector: "both", icon: "🛍" },
      { id: "marketplace-sell", label: "Sell & listings", href: "/shop", sector: "both", icon: "🏪" },
      { id: "marketplace-wallet", label: "Wallet & checkout", href: "/wallet", sector: "both", icon: "💳" },
    ],
  },
  {
    id: "business",
    title: "Shop & Business",
    sector: "professional",
    items: [
      { id: "teams", label: "Teams", description: "Business teams & members", href: "/teams", sector: "professional", icon: "▤" },
      { id: "meetings", label: "Meetings", description: "Schedule & join with room code", href: "/meetings", sector: "professional", icon: "📅" },
      { id: "calls", label: "Calls", description: "Voice & video like WhatsApp", href: "/calls", sector: "both", icon: "☎" },
      { id: "contacts", label: "Contacts", description: "Sync & share with selection", href: "/contacts", sector: "both", icon: "☰" },
      { id: "status", label: "Status feed", description: "24-hour updates", href: "/status", sector: "both", icon: "◌" },
      { id: "shop", label: "Shop & business orders", href: "/shop", sector: "professional", icon: "🛒" },
      { id: "cart", label: "Cart & checkout", href: "/shop#cart", sector: "professional", icon: "🛍" },
      { id: "qr", label: "QR codes", description: "Share shop & payment links", href: "/shop#qr", sector: "professional", icon: "▣" },
      { id: "sales", label: "Sales dashboard", href: "/settings/analytics#sales", sector: "professional", icon: "💰" },
    ],
  },
  {
    id: "jobs",
    title: "Jobs, Hiring & Marketing",
    sector: "professional",
    items: [
      { id: "jobs", label: "Jobs & available roles", href: "/settings/jobs", sector: "professional", icon: "💼" },
      { id: "hiring", label: "Hiring", href: "/settings/jobs#hiring", sector: "professional", icon: "📋" },
      { id: "marketing", label: "Marketing tools", href: "/settings/jobs#marketing", sector: "professional", icon: "📣" },
      { id: "campaigns", label: "Campaigns", href: "/settings/monetization#campaigns", sector: "professional", icon: "🎯" },
    ],
  },
  {
    id: "analytics",
    title: "Analytics & Insights",
    sector: "professional",
    items: [
      { id: "analytics", label: "Analytics overview", href: "/settings/analytics", sector: "professional", icon: "📊" },
      { id: "profile-viewers", label: "Profile viewers", href: "/settings/analytics#viewers", sector: "professional", icon: "👁" },
      { id: "who-viewed", label: "Who viewed", href: "/settings/analytics#who-viewed", sector: "professional", icon: "🔍" },
    ],
  },
  {
    id: "monetization-pro",
    title: "Monetization & Tax",
    sector: "professional",
    items: [
      { id: "monetization", label: "Monetisation", href: "/settings/monetization", sector: "professional", icon: "💎" },
      { id: "subscriptions-mgr", label: "Subscriptions manager", href: "/settings/monetization#subscriptions", sector: "professional", icon: "📅" },
      { id: "tax", label: "Tax info", href: "/settings/monetization#tax", sector: "professional", icon: "📑" },
      { id: "deductions", label: "Refunds & deductions", href: "/wallet#payouts", sector: "professional", icon: "−" },
    ],
  },
  {
    id: "connectivity",
    title: "Connectivity",
    sector: "both",
    items: [
      { id: "wifi", label: "WiFi preferences", href: "/settings/connectivity#wifi", sector: "both", icon: "📶" },
      { id: "airdrop", label: "Airdrop & nearby share", href: "/settings/connectivity#airdrop", sector: "personal", icon: "📡" },
      { id: "offline-sync", label: "Offline sync", href: "/settings/media", sector: "both", icon: "☁" },
    ],
  },
  {
    id: "legal",
    title: "Policy & Agreements",
    sector: "both",
    items: [
      { id: "terms", label: "Terms of service", href: "/settings/legal#terms", sector: "both", icon: "📜" },
      { id: "privacy-policy", label: "Privacy policy", href: "/settings/legal#privacy", sector: "both", icon: "🔒" },
      { id: "agreements", label: "User agreements", href: "/settings/legal#agreements", sector: "both", icon: "✍" },
    ],
  },
  {
    id: "location-safety",
    title: "Location Finder",
    subtitle: "Find Me · follower sharing · live tags",
    sector: "both",
    items: [
      { id: "find-me-settings", label: "Find Me & sharing", description: "Safety mode and follower visibility", href: "/settings/location", sector: "both", icon: "🆘" },
      { id: "find-map", label: "Member location map", description: "Locate findable members", href: "/find", sector: "both", icon: "⊕" },
      { id: "login-location", label: "Login location tracking", href: "/settings/location#login", sector: "both", icon: "🛰" },
    ],
  },
  {
    id: "voice-ui",
    title: "Voice, AI & UI",
    sector: "both",
    items: [
      { id: "voice", label: "Voice control", href: "/settings/account#voice", sector: "both", icon: "🎤" },
      { id: "ai-tag", label: "NEXSOCIO AI tagging", href: "/settings/account#ai", sector: "both", icon: "✦" },
      { id: "ephemeral", label: "Ephemeral navigation", href: "/settings/account#ui", sector: "both", icon: "◌" },
    ],
  },
];

export function groupsForSector(sector: "personal" | "professional" | "all") {
  if (sector === "all") return SETTINGS_GROUPS;
  return SETTINGS_GROUPS.filter(
    (g) => g.sector === sector || g.sector === "both"
  ).map((g) => ({
    ...g,
    items: g.items.filter((i) => i.sector === sector || i.sector === "both"),
  })).filter((g) => g.items.length > 0);
}

export const SECTION_META: Record<string, { title: string; subtitle: string }> = {
  security: { title: "Sign-in & Security", subtitle: "Protect your account" },
  account: { title: "Account Preferences", subtitle: "Locale, voice, notifications" },
  privacy: { title: "Privacy & Visibility", subtitle: "Control your data" },
  network: { title: "Network & Connectors", subtitle: "Slack · GitHub · LinkedIn · email" },
  analytics: { title: "Analytics", subtitle: "Viewers · impressions · sales" },
  jobs: { title: "Jobs & Marketing", subtitle: "Hire · apply · promote" },
  monetization: { title: "Monetization", subtitle: "Rewards · campaigns · tax" },
  schedule: { title: "Schedule Posts", subtitle: "Plan your content calendar" },
  groups: { title: "Groups", subtitle: "Communities & teams" },
  media: { title: "Media & Downloads", subtitle: "Offline · podcast · vlog" },
  connectivity: { title: "Connectivity", subtitle: "WiFi · airdrop · remote" },
  legal: { title: "Legal", subtitle: "Terms · privacy · agreements" },
  help: { title: "Help & Feedback", subtitle: "We're here for you" },
  share: { title: "Share & Invites", subtitle: "Grow your circle" },
  location: { title: "Location Finder", subtitle: "Find Me · sharing · live tags" },
};