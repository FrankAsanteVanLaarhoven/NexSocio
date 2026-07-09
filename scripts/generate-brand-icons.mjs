#!/usr/bin/env node
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logoIcon = join(root, "apps/web/public/brand/logo-icon.jpg");
const iconsDir = join(root, "apps/web/public/icons");
const appDir = join(root, "apps/web/src/app");

mkdirSync(iconsDir, { recursive: true });

const BG = { r: 10, g: 22, b: 40, alpha: 1 };

async function main() {
  const sharp = (await import("sharp")).default;
  const source = sharp(logoIcon).resize(420, 420, { fit: "contain", background: BG });

  for (const size of [16, 32, 192, 512]) {
    const out = join(iconsDir, size === 32 ? "favicon.png" : `icon-${size}.png`);
    await sharp({
      create: { width: size, height: size, channels: 4, background: BG },
    })
      .composite([
        {
          input: await source.resize(Math.round(size * 0.82), Math.round(size * 0.82)).png().toBuffer(),
          gravity: "center",
        },
      ])
      .png()
      .toFile(out);
    console.log(`Wrote ${out}`);
  }

  await sharp({
    create: { width: 180, height: 180, channels: 4, background: BG },
  })
    .composite([
      {
        input: await source.resize(148, 148).png().toBuffer(),
        gravity: "center",
      },
    ])
    .png()
    .toFile(join(appDir, "apple-icon.png"));

  await sharp({
    create: { width: 32, height: 32, channels: 4, background: BG },
  })
    .composite([
      {
        input: await source.resize(26, 26).png().toBuffer(),
        gravity: "center",
      },
    ])
    .png()
    .toFile(join(appDir, "icon.png"));

  console.log("Brand icons generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});