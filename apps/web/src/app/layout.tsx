import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEXSOCIO",
  description: "World-Leading SOTA Socio-Technical Platform",
  applicationName: "NEXSOCIO",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NEXSOCIO",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#00E5FF",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={{ backgroundColor: "#0A0A0A", color: "#F5F5F5" }}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen antialiased bg-[#0A0A0A] text-[#F5F5F5]"
        style={{ backgroundColor: "#0A0A0A", color: "#F5F5F5" }}
        suppressHydrationWarning
      >
        <Providers>
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}