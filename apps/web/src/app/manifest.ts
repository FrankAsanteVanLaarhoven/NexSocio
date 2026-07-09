import type { MetadataRoute } from "next";
import { BRAND_ICONS } from "@/lib/brand";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: `NexSocio — social platform at ${SITE_URL.replace("https://", "")}`,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A1628",
    theme_color: "#00E5FF",
    categories: ["social", "business", "productivity"],
    icons: [
      {
        src: BRAND_ICONS.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: BRAND_ICONS.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: BRAND_ICONS.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Feed", url: "/feed", icons: [{ src: BRAND_ICONS.icon192, sizes: "192x192" }] },
      { name: "Calls", url: "/calls", icons: [{ src: BRAND_ICONS.icon192, sizes: "192x192" }] },
      { name: "Inbox", url: "/inbox", icons: [{ src: BRAND_ICONS.icon192, sizes: "192x192" }] },
    ],
  };
}