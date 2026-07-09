export type LocaleCode =
  | "en"
  | "de"
  | "fr"
  | "nl"
  | "el"
  | "pl"
  | "ru"
  | "ar"
  | "zh"
  | "pt"
  | "it"
  | "ur"
  | "tr"
  | "es"
  | "id"
  | "ja"
  | "ko"
  | "fil"
  | "ha"
  | "yo";

export type TextDirection = "ltr" | "rtl";

export interface LocaleDefinition {
  code: LocaleCode;
  label: string;
  nativeName: string;
  dir: TextDirection;
  /** BCP 47 tag for Intl / Web Speech API */
  bcp47: string;
}

export const LOCALES: Record<LocaleCode, LocaleDefinition> = {
  en: { code: "en", label: "English", nativeName: "English", dir: "ltr", bcp47: "en-GB" },
  de: { code: "de", label: "German", nativeName: "Deutsch", dir: "ltr", bcp47: "de-DE" },
  fr: { code: "fr", label: "French", nativeName: "Français", dir: "ltr", bcp47: "fr-FR" },
  nl: { code: "nl", label: "Dutch", nativeName: "Nederlands", dir: "ltr", bcp47: "nl-NL" },
  el: { code: "el", label: "Greek", nativeName: "Ελληνικά", dir: "ltr", bcp47: "el-GR" },
  pl: { code: "pl", label: "Polish", nativeName: "Polski", dir: "ltr", bcp47: "pl-PL" },
  ru: { code: "ru", label: "Russian", nativeName: "Русский", dir: "ltr", bcp47: "ru-RU" },
  ar: { code: "ar", label: "Arabic", nativeName: "العربية", dir: "rtl", bcp47: "ar-SA" },
  zh: { code: "zh", label: "Chinese", nativeName: "中文", dir: "ltr", bcp47: "zh-CN" },
  pt: { code: "pt", label: "Portuguese", nativeName: "Português", dir: "ltr", bcp47: "pt-PT" },
  it: { code: "it", label: "Italian", nativeName: "Italiano", dir: "ltr", bcp47: "it-IT" },
  ur: { code: "ur", label: "Urdu", nativeName: "اردو", dir: "rtl", bcp47: "ur-PK" },
  tr: { code: "tr", label: "Turkish", nativeName: "Türkçe", dir: "ltr", bcp47: "tr-TR" },
  es: { code: "es", label: "Spanish (Argentina)", nativeName: "Español (AR)", dir: "ltr", bcp47: "es-AR" },
  id: { code: "id", label: "Indonesian", nativeName: "Bahasa Indonesia", dir: "ltr", bcp47: "id-ID" },
  ja: { code: "ja", label: "Japanese", nativeName: "日本語", dir: "ltr", bcp47: "ja-JP" },
  ko: { code: "ko", label: "Korean", nativeName: "한국어", dir: "ltr", bcp47: "ko-KR" },
  fil: { code: "fil", label: "Filipino", nativeName: "Filipino", dir: "ltr", bcp47: "fil-PH" },
  ha: { code: "ha", label: "Hausa", nativeName: "Hausa", dir: "ltr", bcp47: "ha-NG" },
  yo: { code: "yo", label: "Yoruba", nativeName: "Yorùbá", dir: "ltr", bcp47: "yo-NG" },
};

export const LOCALE_CODES = Object.keys(LOCALES) as LocaleCode[];

const LEGACY_MAP: Record<string, LocaleCode> = {
  "en-GB": "en",
  "en-US": "en",
  "en": "en",
  "de-DE": "de",
  "de": "de",
  "fr-FR": "fr",
  "fr": "fr",
  "nl-NL": "nl",
  "nl": "nl",
  "el-GR": "el",
  "el": "el",
  "pl-PL": "pl",
  "pl": "pl",
  "ru-RU": "ru",
  "ru": "ru",
  "ar-SA": "ar",
  "ar": "ar",
  "zh-CN": "zh",
  "zh": "zh",
  "pt-PT": "pt",
  "pt-BR": "pt",
  "pt": "pt",
  "it-IT": "it",
  "it": "it",
  "ur-PK": "ur",
  "ur": "ur",
  "tr-TR": "tr",
  "tr": "tr",
  "es-AR": "es",
  "es-ES": "es",
  "es": "es",
  "id-ID": "id",
  "id": "id",
  "ja-JP": "ja",
  "ja": "ja",
  "ko-KR": "ko",
  "ko": "ko",
  "fil-PH": "fil",
  "fil": "fil",
  "tl": "fil",
  "ha-NG": "ha",
  "ha": "ha",
  "yo-NG": "yo",
  "yo": "yo",
};

export function normalizeLocale(raw: string | undefined): LocaleCode {
  if (!raw) return "en";
  const direct = LEGACY_MAP[raw];
  if (direct) return direct;
  const base = raw.split("-")[0];
  return LEGACY_MAP[base] ?? "en";
}

export function getLocaleDefinition(code: LocaleCode): LocaleDefinition {
  return LOCALES[code];
}