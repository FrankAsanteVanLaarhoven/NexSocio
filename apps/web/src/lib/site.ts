import { BRAND_DISPLAY_NAME } from "./brand";

/** Canonical production domain for NexSocio */
export const SITE_DOMAIN = "nexsocio.com";
export const SITE_NAME = BRAND_DISPLAY_NAME;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.NODE_ENV === "production"
    ? `https://${SITE_DOMAIN}`
    : "http://localhost:3000");

export const SITE_URL_WWW = `https://www.${SITE_DOMAIN}`;

export const SUPPORT_EMAIL = `hello@${SITE_DOMAIN}`;
export const AUTH_EMAIL_PLACEHOLDER = `you@${SITE_DOMAIN}`;

/** Production API subdomains (configure DNS → ingress per service) */
export const PRODUCTION_API_URLS = {
  identity: `https://identity.${SITE_DOMAIN}`,
  social: `https://social.${SITE_DOMAIN}`,
  content: `https://content.${SITE_DOMAIN}`,
  professional: `https://professional.${SITE_DOMAIN}`,
  safety: `https://safety.${SITE_DOMAIN}`,
  robot: `https://robot.${SITE_DOMAIN}`,
  hub: `https://hub.${SITE_DOMAIN}`,
  commerce: `https://commerce.${SITE_DOMAIN}`,
  collaboration: `https://collaboration.${SITE_DOMAIN}`,
  notification: `https://notification.${SITE_DOMAIN}`,
} as const;

export function inviteUrl(code: string) {
  return `${SITE_URL}/invite/${code}`;
}