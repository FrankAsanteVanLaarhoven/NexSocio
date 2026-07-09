"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getLocaleDefinition, normalizeLocale, type LocaleCode } from "./config";
import { loadMessages, getMessagesSync, en } from "./messages";
import { createTranslator, type TranslateFn } from "./translate";
import { useSettingsStore } from "@/lib/settings-store";

interface I18nContextValue {
  locale: LocaleCode;
  dir: "ltr" | "rtl";
  dateLocale: string;
  t: TranslateFn;
  ready: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  dir: "ltr",
  dateLocale: "en-GB",
  t: createTranslator(en, en),
  ready: false,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const rawLocale = useSettingsStore((s) => s.locale);
  const locale = normalizeLocale(rawLocale);
  const def = getLocaleDefinition(locale);
  const [ready, setReady] = useState(locale === "en");

  useEffect(() => {
    if (locale === "en") {
      setReady(true);
      return;
    }
    let cancelled = false;
    setReady(false);
    loadMessages(locale).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const messages = getMessagesSync(locale);
    return {
      locale,
      dir: def.dir,
      dateLocale: def.bcp47,
      t: createTranslator(messages, en),
      ready: locale === "en" || ready,
    };
  }, [locale, def.dir, def.bcp47, ready]);

  useEffect(() => {
    document.documentElement.lang = def.bcp47;
    document.documentElement.dir = def.dir;
  }, [def.bcp47, def.dir]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}