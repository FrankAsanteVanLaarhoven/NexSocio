import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NEXSOCIO",
    short_name: "NEXSOCIO",
    description: "World-Leading SOTA Socio-Technical Platform",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A0A0A",
    theme_color: "#00E5FF",
    categories: ["social", "business", "productivity"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Feed", url: "/", icons: [{ src: "/icons/icon.svg", sizes: "any" }] },
      { name: "Calls", url: "/calls", icons: [{ src: "/icons/icon.svg", sizes: "any" }] },
      { name: "Inbox", url: "/inbox", icons: [{ src: "/icons/icon.svg", sizes: "any" }] },
    ],
  };
}