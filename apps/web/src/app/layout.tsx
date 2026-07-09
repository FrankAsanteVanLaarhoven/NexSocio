import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { SITE_DOMAIN, SITE_NAME, SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Production social platform for feeds, WebRTC calls & meetings, push inbox, marketplace, digital twins, and safety moderation.",
  applicationName: SITE_NAME,
  openGraph: {
    siteName: SITE_NAME,
    url: SITE_URL,
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  formatDetection: { telephone: false },
  keywords: ["NexSocio", SITE_DOMAIN, "social network", "WebRTC", "marketplace"],
};

export const viewport: Viewport = {
  themeColor: "#00E5FF",
  colorScheme: "dark light",
};

const themeBootScript = `(function(){try{var s=JSON.parse(localStorage.getItem('nexsocio-settings')||'{}');var st=s.state||{};var mode=st.themeMode||'dark';var resolved=mode==='system'?(window.matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'):mode;document.documentElement.setAttribute('data-theme',resolved);document.documentElement.style.colorScheme=resolved;var accent=st.accentColor||'#00E5FF';document.documentElement.style.setProperty('--color-accent',accent);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen antialiased bg-base text-primary" suppressHydrationWarning>
        <Providers>
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}