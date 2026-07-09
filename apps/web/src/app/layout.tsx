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