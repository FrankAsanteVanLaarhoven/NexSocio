import type { Messages } from "./messages/en";

export type MessageKey = string;

function getNested(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function createTranslator(messages: Messages, fallback: Messages) {
  return function t(
    key: MessageKey,
    params?: Record<string, string | number>
  ): string {
    let val = getNested(messages, key) ?? getNested(fallback, key) ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        val = val.replaceAll(`{${k}}`, String(v));
      }
    }
    return val;
  };
}

export type TranslateFn = ReturnType<typeof createTranslator>;