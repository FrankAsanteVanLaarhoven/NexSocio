import type { MetadataRoute } from "next";
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
    background_color: "#0A0A0A",
    theme_color: "#00E5FF",
    categories: ["social", "business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      { name: "Feed", url: "/feed", icons: [{ src: "/icons/icon.svg", sizes: "any" }] },
      { name: "Calls", url: "/calls", icons: [{ src: "/icons/icon.svg", sizes: "any" }] },
      { name: "Inbox", url: "/inbox", icons: [{ src: "/icons/icon.svg", sizes: "any" }] },
    ],
  };
}