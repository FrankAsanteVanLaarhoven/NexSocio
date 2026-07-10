import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  compress: true,
  devIndicators: false,
  outputFileTracingRoot: rootDir,
  transpilePackages: ["@nexus/ui", "@nexus/types"],
  experimental: {
    optimizePackageImports: ["@nexus/ui", "lucide-react"],
  },
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ],
};

export default nextConfig;