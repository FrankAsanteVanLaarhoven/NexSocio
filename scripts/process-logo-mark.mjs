#!/usr/bin/env node
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Canonical source — see apps/web/src/lib/brand.ts and public/brand/brand.lock.json
const input = join(root, "apps/web/public/brand/logo-mark-source.jpg");
const output = join(root, "apps/web/public/brand/logo-mark.png");

function isBackground(r, g, b) {
  const avg = (r + g + b) / 3;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  if (avg >= 248 && spread <= 8) return false;
  if (spread <= 18 && avg >= 155 && avg <= 246) return true;
  return avg >= 250;
}

async function main() {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isBackground(r, g, b)) data[i + 3] = 0;
  }

  const png = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();

  await sharp(png).toFile(output);
  await sharp(png)
    .tint({ r: 0, g: 229, b: 255 })
    .toFile(join(root, "apps/web/public/brand/logo-mark-accent.png"));
  await sharp(png)
    .tint({ r: 0, g: 140, b: 180 })
    .toFile(join(root, "apps/web/public/brand/logo-mark-accent-dark.png"));

  console.log(`Wrote ${output} + accent variants`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});