#!/usr/bin/env node
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logoMark = join(root, "apps/web/public/brand/logo-mark.png");
const iconsDir = join(root, "apps/web/public/icons");
const appDir = join(root, "apps/web/src/app");

mkdirSync(iconsDir, { recursive: true });

const BG = { r: 10, g: 22, b: 40, alpha: 1 };

async function main() {
  const sharp = (await import("sharp")).default;
  const source = sharp(logoMark).resize(820, 820, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });

  for (const size of [16, 32, 192, 512]) {
    const markSize = Math.round(size * 0.78);
    const out = join(iconsDir, size === 32 ? "favicon.png" : `icon-${size}.png`);
    await sharp({
      create: { width: size, height: size, channels: 4, background: BG },
    })
      .composite([
        {
          input: await source.resize(markSize, markSize).png().toBuffer(),
          gravity: "center",
        },
      ])
      .png()
      .toFile(out);
    console.log(`Wrote ${out}`);
  }

  for (const [w, h, mark] of [
    [180, 180, 148],
    [32, 32, 26],
  ]) {
    const out = w === 32 ? join(appDir, "icon.png") : join(appDir, "apple-icon.png");
    await sharp({
      create: { width: w, height: h, channels: 4, background: BG },
    })
      .composite([
        {
          input: await source.resize(mark, mark).png().toBuffer(),
          gravity: "center",
        },
      ])
      .png()
      .toFile(out);
    console.log(`Wrote ${out}`);
  }

  console.log("Brand icons generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});