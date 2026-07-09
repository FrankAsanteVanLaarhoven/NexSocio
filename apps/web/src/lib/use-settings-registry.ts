"use client";

import { useMemo } from "react";
import type { AppIconName } from "@/components/icons/AppIcon";
import { useTranslation } from "@/i18n";
import type { SettingsGroup, SettingsItem } from "./settings-registry";

function item(
  id: string,
  labelKey: string,
  href: string,
  sector: SettingsItem["sector"],
  icon?: AppIconName,
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
      item("auth-methods", "settings.items.authMethods", "/settings/security", "both", "shield", "settings.items.authMethodsDesc"),
      item("sessions", "settings.items.sessions", "/settings/security#sessions", "both", "smartphone", "settings.items.sessionsDesc"),
      item("remote-access", "settings.items.remoteAccess", "/settings/connectivity", "both", "satellite", "settings.items.remoteAccessDesc"),
    ],
  },
  {
    id: "account",
    titleKey: "settings.groups.account.title",
    subtitleKey: "settings.groups.account.subtitle",
    sector: "both" as const,
    items: [
      item("prefs", "settings.items.prefs", "/settings/account", "both", "prefs"),
      item("inbox", "settings.items.inbox", "/inbox", "both", "mail", "settings.items.inboxDesc"),
      item("help", "settings.items.help", "/settings/help", "both", "help"),
    ],
  },
  {
    id: "privacy",
    titleKey: "settings.groups.privacy.title",
    subtitleKey: "settings.groups.privacy.subtitle",
    sector: "both" as const,
    items: [
      item("data-privacy", "settings.items.dataPrivacy", "/settings/privacy", "both", "privacy", "settings.items.dataPrivacyDesc"),
      item("visibility", "settings.items.visibility", "/settings/privacy#visibility", "both", "eye", "settings.items.visibilityDesc"),
      item("advertising-data", "settings.items.advertisingData", "/settings/privacy#ads", "both", "chart", "settings.items.advertisingDataDesc"),
    ],
  },
  {
    id: "social-personal",
    titleKey: "settings.groups.socialPersonal.title",
    subtitleKey: "settings.groups.socialPersonal.subtitle",
    sector: "personal" as const,
    items: [
      item("friends", "settings.items.friends", "/connections", "personal", "friends"),
      item("followers", "settings.items.followers", "/settings/network#followers", "personal", "followers"),
      item("groups", "settings.items.groups", "/settings/groups", "personal", "groups"),
      item("near-me", "settings.items.nearMe", "/map", "personal", "location"),
      item("find-me", "settings.items.findMe", "/settings/location", "personal", "sos", "settings.items.findMeDesc"),
      item("location-finder", "settings.items.locationFinder", "/find", "personal", "finder", "settings.items.locationFinderDesc"),
      item("share", "settings.items.share", "/settings/share", "personal", "share"),
    ],
  },
  {
    id: "network-pro",
    titleKey: "settings.groups.networkPro.title",
    subtitleKey: "settings.groups.networkPro.subtitle",
    sector: "professional" as const,
    items: [
      item("network", "settings.items.network", "/connections", "professional", "network"),
      item("viewers", "settings.items.viewers", "/settings/analytics#viewers", "professional", "viewers"),
      item("impressions", "settings.items.impressions", "/settings/analytics#impressions", "professional", "impressions"),
      item("connectors", "settings.items.connectors", "/settings/network", "professional", "connectors", "settings.items.connectorsDesc"),
    ],
  },
  {
    id: "connectors",
    titleKey: "settings.groups.connectors.title",
    subtitleKey: "settings.groups.connectors.subtitle",
    sector: "both" as const,
    items: [
      item("slack", "settings.items.slack", "/settings/network#slack", "both", "slack"),
      item("github", "settings.items.github", "/settings/network#github", "both", "github"),
      item("linkedin", "settings.items.linkedin", "/settings/network#linkedin", "both", "linkedin"),
      item("email", "settings.items.emailAccounts", "/settings/network#email", "both", "email"),
      item("social-connect", "settings.items.socialAccounts", "/settings/network#social", "both", "social"),
    ],
  },
  {
    id: "content",
    titleKey: "settings.groups.content.title",
    subtitleKey: "settings.groups.content.subtitle",
    sector: "both" as const,
    items: [
      item("schedule", "settings.items.schedulePosts", "/settings/schedule", "both", "schedule"),
      item("podcast", "settings.items.podcast", "/studio", "personal", "podcast"),
      item("vlog", "settings.items.vlog", "/studio", "personal", "vlog"),
      item("live", "settings.items.liveStreams", "/live", "both", "streams"),
      item("uploads", "settings.items.mediaUploads", "/studio", "both", "upload", "settings.items.mediaUploadsDesc"),
      item("offline", "settings.items.offlineDownloads", "/settings/media", "personal", "download"),
    ],
  },
  {
    id: "wallet",
    titleKey: "settings.groups.wallet.title",
    subtitleKey: "settings.groups.wallet.subtitle",
    sector: "both" as const,
    items: [
      item("wallet", "settings.items.wallet", "/wallet", "both", "wallet"),
      item("cards", "settings.items.addCard", "/wallet#cards", "both", "addCard"),
      item("stripe", "settings.items.stripe", "/wallet#stripe", "both", "stripe"),
      item("paypal", "settings.items.paypal", "/wallet#paypal", "both", "paypal"),
      item("transactions", "settings.items.transactions", "/wallet#transactions", "both", "receipt"),
      item("payouts", "settings.items.payouts", "/wallet#payouts", "both", "refund"),
      item("crypto", "settings.items.crypto", "/wallet#crypto", "personal", "crypto"),
    ],
  },
  {
    id: "monetization-personal",
    titleKey: "settings.groups.monetizationPersonal.title",
    subtitleKey: "settings.groups.monetizationPersonal.subtitle",
    sector: "personal" as const,
    items: [
      item("live-rewards", "settings.items.liveRewards", "/settings/monetization#live-rewards", "personal", "rewards"),
      item("promotions", "settings.items.promotions", "/settings/monetization#promotions", "personal", "promotions"),
      item("bonus-coins", "settings.items.bonusCoins", "/wallet#crypto", "personal", "bonus"),
      item("subscriptions-personal", "settings.items.subscriptions", "/settings/monetization#subscriptions", "personal", "star"),
    ],
  },
  {
    id: "marketplace",
    titleKey: "settings.groups.marketplace.title",
    subtitleKey: "settings.groups.marketplace.subtitle",
    sector: "both" as const,
    items: [
      item("marketplace", "settings.items.browseMarketplace", "/marketplace", "both", "marketplace"),
      item("marketplace-sell", "settings.items.sellListings", "/shop", "both", "sell"),
      item("marketplace-wallet", "settings.items.walletCheckout", "/wallet", "both", "wallet"),
    ],
  },
  {
    id: "business",
    titleKey: "settings.groups.business.title",
    subtitleKey: "settings.groups.business.subtitle",
    sector: "professional" as const,
    items: [
      item("teams", "settings.items.teams", "/teams", "professional", "teams", "settings.items.teamsDesc"),
      item("meetings", "settings.items.meetings", "/meetings", "professional", "schedule", "settings.items.meetingsDesc"),
      item("calls", "settings.items.calls", "/calls", "both", "calls", "settings.items.callsDesc"),
      item("contacts", "settings.items.contacts", "/contacts", "both", "contacts", "settings.items.contactsDesc"),
      item("status", "settings.items.statusFeed", "/status", "both", "status", "settings.items.statusFeedDesc"),
      item("shop", "settings.items.shop", "/shop", "professional", "shop"),
      item("cart", "settings.items.cart", "/shop#cart", "professional", "cart"),
      item("qr", "settings.items.qr", "/shop#qr", "professional", "qr", "settings.items.qrDesc"),
      item("sales", "settings.items.sales", "/settings/analytics#sales", "professional", "sales"),
    ],
  },
  {
    id: "jobs",
    titleKey: "settings.groups.jobs.title",
    subtitleKey: "settings.groups.jobs.subtitle",
    sector: "professional" as const,
    items: [
      item("jobs", "settings.items.jobs", "/settings/jobs", "professional", "jobs"),
      item("hiring", "settings.items.hiring", "/settings/jobs#hiring", "professional", "hiring"),
      item("marketing", "settings.items.marketing", "/settings/jobs#marketing", "professional", "marketing"),
      item("campaigns", "settings.items.campaigns", "/settings/monetization#campaigns", "professional", "campaigns"),
    ],
  },
  {
    id: "analytics",
    titleKey: "settings.groups.analytics.title",
    subtitleKey: "settings.groups.analytics.subtitle",
    sector: "professional" as const,
    items: [
      item("analytics", "settings.items.analytics", "/settings/analytics", "professional", "analytics"),
      item("profile-viewers", "settings.items.profileViewers", "/settings/analytics#viewers", "professional", "eye"),
      item("who-viewed", "settings.items.whoViewed", "/settings/analytics#who-viewed", "professional", "finder"),
    ],
  },
  {
    id: "monetization-pro",
    titleKey: "settings.groups.monetizationPro.title",
    subtitleKey: "settings.groups.monetizationPro.subtitle",
    sector: "professional" as const,
    items: [
      item("monetization", "settings.items.monetization", "/settings/monetization", "professional", "monetization"),
      item("subscriptions-mgr", "settings.items.subscriptionsMgr", "/settings/monetization#subscriptions", "professional", "schedule"),
      item("tax", "settings.items.tax", "/settings/monetization#tax", "professional", "tax"),
      item("deductions", "settings.items.deductions", "/wallet#payouts", "professional", "minus"),
    ],
  },
  {
    id: "connectivity",
    titleKey: "settings.groups.connectivity.title",
    subtitleKey: "settings.groups.connectivity.subtitle",
    sector: "both" as const,
    items: [
      item("wifi", "settings.items.wifi", "/settings/connectivity#wifi", "both", "wifi"),
      item("airdrop", "settings.items.airdrop", "/settings/connectivity#airdrop", "personal", "airdrop"),
      item("offline-sync", "settings.items.offlineSync", "/settings/media", "both", "cloud"),
    ],
  },
  {
    id: "legal",
    titleKey: "settings.groups.legal.title",
    subtitleKey: "settings.groups.legal.subtitle",
    sector: "both" as const,
    items: [
      item("terms", "settings.items.terms", "/settings/legal#terms", "both", "terms"),
      item("privacy-policy", "settings.items.privacyPolicy", "/settings/legal#privacy", "both", "legal"),
      item("agreements", "settings.items.agreements", "/settings/legal#agreements", "both", "agreements"),
    ],
  },
  {
    id: "location-safety",
    titleKey: "settings.groups.locationSafety.title",
    subtitleKey: "settings.groups.locationSafety.subtitle",
    sector: "both" as const,
    items: [
      item("find-me-settings", "settings.items.findMeSharing", "/settings/location", "both", "findMe", "settings.items.findMeSharingDesc"),
      item("find-map", "settings.items.memberMap", "/find", "both", "memberMap", "settings.items.memberMapDesc"),
      item("login-location", "settings.items.loginLocation", "/settings/location#login", "both", "loginLocation"),
    ],
  },
  {
    id: "voice-ui",
    titleKey: "settings.groups.voiceUiGroup.title",
    subtitleKey: "settings.groups.voiceUiGroup.subtitle",
    sector: "both" as const,
    items: [
      item("voice", "settings.items.voiceControl", "/settings/account#voice", "both", "voice"),
      item("ai-tag", "settings.items.aiTagging", "/settings/account#ai", "both", "ai"),
      item("ephemeral", "settings.items.ephemeral", "/settings/account#ui", "both", "ephemeral"),
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