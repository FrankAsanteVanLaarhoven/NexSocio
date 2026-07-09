"use client";

import { useMemo } from "react";
import { useTranslation } from "@/i18n";
import type { SettingsGroup, SettingsItem } from "./settings-registry";

function item(
  id: string,
  labelKey: string,
  href: string,
  sector: SettingsItem["sector"],
  icon?: string,
  descKey?: string,
  badge?: string
): SettingsItem & { labelKey: string; descKey?: string } {
  return {
    id,
    label: "",
    labelKey,
    href,
    sector,
    icon,
    description: descKey ? "" : undefined,
    descKey,
    badge,
  };
}

const REGISTRY_DEF = [
  {
    id: "security",
    titleKey: "settings.groups.security.title",
    subtitleKey: "settings.groups.security.subtitle",
    sector: "both" as const,
    items: [
      item("auth-methods", "settings.items.authMethods", "/settings/security", "both", "🔐", "settings.items.authMethodsDesc"),
      item("sessions", "settings.items.sessions", "/settings/security#sessions", "both", "📱", "settings.items.sessionsDesc"),
      item("remote-access", "settings.items.remoteAccess", "/settings/connectivity", "both", "🛰", "settings.items.remoteAccessDesc"),
    ],
  },
  {
    id: "account",
    titleKey: "settings.groups.account.title",
    subtitleKey: "settings.groups.account.subtitle",
    sector: "both" as const,
    items: [
      item("prefs", "settings.items.prefs", "/settings/account", "both", "⚙"),
      item("inbox", "settings.items.inbox", "/inbox", "both", "✉", "settings.items.inboxDesc"),
      item("help", "settings.items.help", "/settings/help", "both", "💬"),
    ],
  },
  {
    id: "privacy",
    titleKey: "settings.groups.privacy.title",
    subtitleKey: "settings.groups.privacy.subtitle",
    sector: "both" as const,
    items: [
      item("data-privacy", "settings.items.dataPrivacy", "/settings/privacy", "both", "🛡", "settings.items.dataPrivacyDesc"),
      item("visibility", "settings.items.visibility", "/settings/privacy#visibility", "both", "👁", "settings.items.visibilityDesc"),
      item("advertising-data", "settings.items.advertisingData", "/settings/privacy#ads", "both", "📊", "settings.items.advertisingDataDesc"),
    ],
  },
  {
    id: "social-personal",
    titleKey: "settings.groups.socialPersonal.title",
    subtitleKey: "settings.groups.socialPersonal.subtitle",
    sector: "personal" as const,
    items: [
      item("friends", "settings.items.friends", "/connections", "personal", "👥"),
      item("followers", "settings.items.followers", "/settings/network#followers", "personal", "↔"),
      item("groups", "settings.items.groups", "/settings/groups", "personal", "◎"),
      item("near-me", "settings.items.nearMe", "/map", "personal", "📍"),
      item("find-me", "settings.items.findMe", "/settings/location", "personal", "🆘", "settings.items.findMeDesc"),
      item("location-finder", "settings.items.locationFinder", "/find", "personal", "⊕", "settings.items.locationFinderDesc"),
      item("share", "settings.items.share", "/settings/share", "personal", "↗"),
    ],
  },
  {
    id: "network-pro",
    titleKey: "settings.groups.networkPro.title",
    subtitleKey: "settings.groups.networkPro.subtitle",
    sector: "professional" as const,
    items: [
      item("network", "settings.items.network", "/connections", "professional", "◇"),
      item("viewers", "settings.items.viewers", "/settings/analytics#viewers", "professional", "👀"),
      item("impressions", "settings.items.impressions", "/settings/analytics#impressions", "professional", "📈"),
      item("connectors", "settings.items.connectors", "/settings/network", "professional", "🔗", "settings.items.connectorsDesc"),
    ],
  },
  {
    id: "connectors",
    titleKey: "settings.groups.connectors.title",
    subtitleKey: "settings.groups.connectors.subtitle",
    sector: "both" as const,
    items: [
      item("slack", "settings.items.slack", "/settings/network#slack", "both", "💼"),
      item("github", "settings.items.github", "/settings/network#github", "both", "⌥"),
      item("linkedin", "settings.items.linkedin", "/settings/network#linkedin", "both", "in"),
      item("email", "settings.items.emailAccounts", "/settings/network#email", "both", "@"),
      item("social-connect", "settings.items.socialAccounts", "/settings/network#social", "both", "◈"),
    ],
  },
  {
    id: "content",
    titleKey: "settings.groups.content.title",
    subtitleKey: "settings.groups.content.subtitle",
    sector: "both" as const,
    items: [
      item("schedule", "settings.items.schedulePosts", "/settings/schedule", "both", "🗓"),
      item("podcast", "settings.items.podcast", "/studio", "personal", "🎙"),
      item("vlog", "settings.items.vlog", "/studio", "personal", "📹"),
      item("live", "settings.items.liveStreams", "/live", "both", "●"),
      item("uploads", "settings.items.mediaUploads", "/studio", "both", "⬆", "settings.items.mediaUploadsDesc"),
      item("offline", "settings.items.offlineDownloads", "/settings/media", "personal", "⬇"),
    ],
  },
  {
    id: "wallet",
    titleKey: "settings.groups.wallet.title",
    subtitleKey: "settings.groups.wallet.subtitle",
    sector: "both" as const,
    items: [
      item("wallet", "settings.items.wallet", "/wallet", "both", "💳"),
      item("cards", "settings.items.addCard", "/wallet#cards", "both", "＋"),
      item("stripe", "settings.items.stripe", "/wallet#stripe", "both", "S"),
      item("paypal", "settings.items.paypal", "/wallet#paypal", "both", "P"),
      item("transactions", "settings.items.transactions", "/wallet#transactions", "both", "🧾"),
      item("payouts", "settings.items.payouts", "/wallet#payouts", "both", "↩"),
      item("crypto", "settings.items.crypto", "/wallet#crypto", "personal", "◎"),
    ],
  },
  {
    id: "monetization-personal",
    titleKey: "settings.groups.monetizationPersonal.title",
    subtitleKey: "settings.groups.monetizationPersonal.subtitle",
    sector: "personal" as const,
    items: [
      item("live-rewards", "settings.items.liveRewards", "/settings/monetization#live-rewards", "personal", "🎁"),
      item("promotions", "settings.items.promotions", "/settings/monetization#promotions", "personal", "✨"),
      item("bonus-coins", "settings.items.bonusCoins", "/wallet#crypto", "personal", "🪙"),
      item("subscriptions-personal", "settings.items.subscriptions", "/settings/monetization#subscriptions", "personal", "★"),
    ],
  },
  {
    id: "marketplace",
    titleKey: "settings.groups.marketplace.title",
    subtitleKey: "settings.groups.marketplace.subtitle",
    sector: "both" as const,
    items: [
      item("marketplace", "settings.items.browseMarketplace", "/marketplace", "both", "🛍"),
      item("marketplace-sell", "settings.items.sellListings", "/shop", "both", "🏪"),
      item("marketplace-wallet", "settings.items.walletCheckout", "/wallet", "both", "💳"),
    ],
  },
  {
    id: "business",
    titleKey: "settings.groups.business.title",
    subtitleKey: "settings.groups.business.subtitle",
    sector: "professional" as const,
    items: [
      item("teams", "settings.items.teams", "/teams", "professional", "▤", "settings.items.teamsDesc"),
      item("meetings", "settings.items.meetings", "/meetings", "professional", "📅", "settings.items.meetingsDesc"),
      item("calls", "settings.items.calls", "/calls", "both", "☎", "settings.items.callsDesc"),
      item("contacts", "settings.items.contacts", "/contacts", "both", "☰", "settings.items.contactsDesc"),
      item("status", "settings.items.statusFeed", "/status", "both", "◌", "settings.items.statusFeedDesc"),
      item("shop", "settings.items.shop", "/shop", "professional", "🛒"),
      item("cart", "settings.items.cart", "/shop#cart", "professional", "🛍"),
      item("qr", "settings.items.qr", "/shop#qr", "professional", "▣", "settings.items.qrDesc"),
      item("sales", "settings.items.sales", "/settings/analytics#sales", "professional", "💰"),
    ],
  },
  {
    id: "jobs",
    titleKey: "settings.groups.jobs.title",
    subtitleKey: "settings.groups.jobs.subtitle",
    sector: "professional" as const,
    items: [
      item("jobs", "settings.items.jobs", "/settings/jobs", "professional", "💼"),
      item("hiring", "settings.items.hiring", "/settings/jobs#hiring", "professional", "📋"),
      item("marketing", "settings.items.marketing", "/settings/jobs#marketing", "professional", "📣"),
      item("campaigns", "settings.items.campaigns", "/settings/monetization#campaigns", "professional", "🎯"),
    ],
  },
  {
    id: "analytics",
    titleKey: "settings.groups.analytics.title",
    subtitleKey: "settings.groups.analytics.subtitle",
    sector: "professional" as const,
    items: [
      item("analytics", "settings.items.analytics", "/settings/analytics", "professional", "📊"),
      item("profile-viewers", "settings.items.profileViewers", "/settings/analytics#viewers", "professional", "👁"),
      item("who-viewed", "settings.items.whoViewed", "/settings/analytics#who-viewed", "professional", "🔍"),
    ],
  },
  {
    id: "monetization-pro",
    titleKey: "settings.groups.monetizationPro.title",
    subtitleKey: "settings.groups.monetizationPro.subtitle",
    sector: "professional" as const,
    items: [
      item("monetization", "settings.items.monetization", "/settings/monetization", "professional", "💎"),
      item("subscriptions-mgr", "settings.items.subscriptionsMgr", "/settings/monetization#subscriptions", "professional", "📅"),
      item("tax", "settings.items.tax", "/settings/monetization#tax", "professional", "📑"),
      item("deductions", "settings.items.deductions", "/wallet#payouts", "professional", "−"),
    ],
  },
  {
    id: "connectivity",
    titleKey: "settings.groups.connectivity.title",
    subtitleKey: "settings.groups.connectivity.subtitle",
    sector: "both" as const,
    items: [
      item("wifi", "settings.items.wifi", "/settings/connectivity#wifi", "both", "📶"),
      item("airdrop", "settings.items.airdrop", "/settings/connectivity#airdrop", "personal", "📡"),
      item("offline-sync", "settings.items.offlineSync", "/settings/media", "both", "☁"),
    ],
  },
  {
    id: "legal",
    titleKey: "settings.groups.legal.title",
    subtitleKey: "settings.groups.legal.subtitle",
    sector: "both" as const,
    items: [
      item("terms", "settings.items.terms", "/settings/legal#terms", "both", "📜"),
      item("privacy-policy", "settings.items.privacyPolicy", "/settings/legal#privacy", "both", "🔒"),
      item("agreements", "settings.items.agreements", "/settings/legal#agreements", "both", "✍"),
    ],
  },
  {
    id: "location-safety",
    titleKey: "settings.groups.locationSafety.title",
    subtitleKey: "settings.groups.locationSafety.subtitle",
    sector: "both" as const,
    items: [
      item("find-me-settings", "settings.items.findMeSharing", "/settings/location", "both", "🆘", "settings.items.findMeSharingDesc"),
      item("find-map", "settings.items.memberMap", "/find", "both", "⊕", "settings.items.memberMapDesc"),
      item("login-location", "settings.items.loginLocation", "/settings/location#login", "both", "🛰"),
    ],
  },
  {
    id: "voice-ui",
    titleKey: "settings.groups.voiceUiGroup.title",
    subtitleKey: "settings.groups.voiceUiGroup.subtitle",
    sector: "both" as const,
    items: [
      item("voice", "settings.items.voiceControl", "/settings/account#voice", "both", "🎤"),
      item("ai-tag", "settings.items.aiTagging", "/settings/account#ai", "both", "✦"),
      item("ephemeral", "settings.items.ephemeral", "/settings/account#ui", "both", "◌"),
    ],
  },
] as const;

const SECTION_KEYS: Record<string, { titleKey: string; subtitleKey: string }> = {
  security: { titleKey: "settings.sections.security.title", subtitleKey: "settings.sections.security.subtitle" },
  account: { titleKey: "settings.sections.account.title", subtitleKey: "settings.sections.account.subtitle" },
  privacy: { titleKey: "settings.sections.privacy.title", subtitleKey: "settings.sections.privacy.subtitle" },
  network: { titleKey: "settings.sections.network.title", subtitleKey: "settings.sections.network.subtitle" },
  analytics: { titleKey: "settings.sections.analytics.title", subtitleKey: "settings.sections.analytics.subtitle" },
  jobs: { titleKey: "settings.sections.jobs.title", subtitleKey: "settings.sections.jobs.subtitle" },
  monetization: { titleKey: "settings.sections.monetization.title", subtitleKey: "settings.sections.monetization.subtitle" },
  schedule: { titleKey: "settings.sections.schedule.title", subtitleKey: "settings.sections.schedule.subtitle" },
  groups: { titleKey: "settings.sections.groups.title", subtitleKey: "settings.sections.groups.subtitle" },
  media: { titleKey: "settings.sections.media.title", subtitleKey: "settings.sections.media.subtitle" },
  connectivity: { titleKey: "settings.sections.connectivity.title", subtitleKey: "settings.sections.connectivity.subtitle" },
  legal: { titleKey: "settings.sections.legal.title", subtitleKey: "settings.sections.legal.subtitle" },
  help: { titleKey: "settings.sections.help.title", subtitleKey: "settings.sections.help.subtitle" },
  share: { titleKey: "settings.sections.share.title", subtitleKey: "settings.sections.share.subtitle" },
  location: { titleKey: "settings.sections.location.title", subtitleKey: "settings.sections.location.subtitle" },
};

export function useSettingsRegistry() {
  const { t } = useTranslation();

  const groups = useMemo((): SettingsGroup[] => {
    return REGISTRY_DEF.map((g) => ({
      id: g.id,
      title: t(g.titleKey),
      subtitle: g.subtitleKey ? t(g.subtitleKey) : undefined,
      sector: g.sector,
      items: g.items.map((i) => ({
        id: i.id,
        label: t(i.labelKey),
        description: i.descKey ? t(i.descKey) : undefined,
        href: i.href,
        sector: i.sector,
        icon: i.icon,
        badge: i.badge,
      })),
    }));
  }, [t]);

  const sectionMeta = useMemo(() => {
    const out: Record<string, { title: string; subtitle: string }> = {};
    for (const [id, keys] of Object.entries(SECTION_KEYS)) {
      out[id] = { title: t(keys.titleKey), subtitle: t(keys.subtitleKey) };
    }
    return out;
  }, [t]);

  return { groups, sectionMeta, groupsForSector: (sector: "personal" | "professional" | "all") => {
    const src = sector === "all" ? groups : groups
      .filter((g) => g.sector === sector || g.sector === "both")
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => i.sector === sector || i.sector === "both"),
      }))
      .filter((g) => g.items.length > 0);
    return src;
  }};
}