#!/usr/bin/env node
/**
 * Generates locale message files from en.ts + per-locale override maps.
 * Run: node scripts/generate-i18n-locales.mjs
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

// Parse en.ts export (simple regex extraction of the object)
const enPath = join(MESSAGES_DIR, "en.ts");
const enSrc = readFileSync(enPath, "utf8");
const match = enSrc.match(/const messages = (\{[\s\S]*\}) as const;/);
if (!match) {
  console.error("Could not parse en.ts");
  process.exit(1);
}
const enMessages = eval(`(${match[1]})`);
const enFlat = flatten(enMessages);

const overrideFiles = readdirSync(OVERRIDES_DIR).filter((f) => f.endsWith(".json"));

for (const file of overrideFiles) {
  const code = file.replace(".json", "");
  const overrides = JSON.parse(readFileSync(join(OVERRIDES_DIR, file), "utf8"));
  const overrideFlat = flatten(overrides);
  const mergedFlat = { ...enFlat, ...overrideFlat };
  const merged = unflatten(mergedFlat);

  const out = `import type { Messages } from "./en";

const messages: Messages = ${JSON.stringify(merged, null, 2)} as Messages;

export default messages;
`;
  writeFileSync(join(MESSAGES_DIR, `${code}.ts`), out);
  console.log(`Generated ${code}.ts (${Object.keys(overrideFlat).length} overrides)`);
}

console.log("Done.");