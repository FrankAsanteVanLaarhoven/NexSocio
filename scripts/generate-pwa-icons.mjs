#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svgPath = join(root, "apps/web/public/icons/icon.svg");
const outDir = join(root, "apps/web/public/icons");

mkdirSync(outDir, { recursive: true });

const svg = readFileSync(svgPath);

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.warn("sharp not installed — run: npm install -D sharp");
    process.exit(0);
  }

  for (const size of [192, 512]) {
    const out = join(outDir, `icon-${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log(`Wrote ${out}`);
  }
}

main();