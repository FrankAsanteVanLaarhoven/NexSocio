#!/usr/bin/env node
/**
 * Deep-merges new i18n keys from en.ts into all override JSON files.
 * Run after adding keys to en.ts: node scripts/merge-i18n-overrides.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MESSAGES_DIR = join(ROOT, "apps/web/src/i18n/messages");
const OVERRIDES_DIR = join(MESSAGES_DIR, "overrides");

function deepMerge(base, override) {
  if (!override) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = deepMerge(base[k] ?? {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function unflatten(flat) {
  const out = {};
  for (const [path, val] of Object.entries(flat)) {
    const parts = path.split(".");
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] ?? {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }
  return out;
}

const enSrc = readFileSync(join(MESSAGES_DIR, "en.ts"), "utf8");
const match = enSrc.match(/const messages = (\{[\s\S]*\}) as const;/);
if (!match) {
  console.error("Could not parse en.ts");
  process.exit(1);
}
const enMessages = eval(`(${match[1]})`);
const enFlat = flatten(enMessages);

const overrideFiles = readdirSync(OVERRIDES_DIR).filter((f) => f.endsWith(".json"));

for (const file of overrideFiles) {
  const path = join(OVERRIDES_DIR, file);
  const existing = JSON.parse(readFileSync(path, "utf8"));
  const existingFlat = flatten(existing);

  // Add any en keys missing from this override (keeps existing translations)
  const mergedFlat = { ...enFlat, ...existingFlat };
  const merged = unflatten(mergedFlat);

  writeFileSync(path, JSON.stringify(merged, null, 2) + "\n");
  const added = Object.keys(enFlat).filter((k) => !(k in existingFlat)).length;
  console.log(`${file}: ensured ${Object.keys(enFlat).length} keys (${added} were new)`);
}

console.log("Override merge complete.");