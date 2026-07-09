import type { LocaleCode } from "../config";
import type { Messages } from "./en";
import en from "./en";

type LocaleLoader = () => Promise<{ default: Messages }>;

const loaders: Record<LocaleCode, LocaleLoader> = {
  en: () => Promise.resolve({ default: en }),
  de: () => import("./de"),
  fr: () => import("./fr"),
  nl: () => import("./nl"),
  el: () => import("./el"),
  pl: () => import("./pl"),
  ru: () => import("./ru"),
  ar: () => import("./ar"),
  zh: () => import("./zh"),
  pt: () => import("./pt"),
  it: () => import("./it"),
  ur: () => import("./ur"),
  tr: () => import("./tr"),
  es: () => import("./es"),
  id: () => import("./id"),
  ja: () => import("./ja"),
  ko: () => import("./ko"),
  fil: () => import("./fil"),
  ha: () => import("./ha"),
  yo: () => import("./yo"),
};

const cache = new Map<LocaleCode, Messages>();
cache.set("en", en);

export async function loadMessages(code: LocaleCode): Promise<Messages> {
  if (cache.has(code)) return cache.get(code)!;
  const mod = await loaders[code]();
  cache.set(code, mod.default);
  return mod.default;
}

export function getMessagesSync(code: LocaleCode): Messages {
  return cache.get(code) ?? en;
}

export { en };
export type { Messages };