import { useTranslation } from "./I18nProvider";

export function useFormatDate() {
  const { dateLocale } = useTranslation();
  return {
    formatDateTime: (iso: string) =>
      new Date(iso).toLocaleString(dateLocale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    formatDate: (iso: string, opts?: Intl.DateTimeFormatOptions) =>
      new Date(iso).toLocaleDateString(dateLocale, opts),
    formatTime: (iso: string, opts?: Intl.DateTimeFormatOptions) =>
      new Date(iso).toLocaleTimeString(dateLocale, opts),
  };
}