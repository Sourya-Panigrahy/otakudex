import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

import { SerwistProvider } from "./serwist-provider";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Otaku Dex",
  title: {
    default: "Otaku Dex",
    template: "%s · Otaku Dex",
  },
  description:
    "Search Jikan, track plan to watch / watching / watched, and episode progress.",
  appleWebApp: {
    capable: true,
    title: "Otaku Dex",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#09090b" },
  ],
};

function HeaderFallback() {
  return (
    <div
      className="h-[72px] border-b border-white/10 bg-black/15 backdrop-blur-2xl"
      aria-hidden
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.className} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-zinc-950 text-zinc-100">
        <SerwistProvider swUrl="/serwist/sw.js">
          <Providers>
            <Suspense fallback={<HeaderFallback />}>
              <Header />
            </Suspense>
            <main className="flex-1">
              <div className="mx-auto w-full max-w-[1920px] px-4 py-5 sm:px-6 sm:py-7 lg:px-10 xl:px-12">
                {children}
              </div>
            </main>
            <Footer />
          </Providers>
        </SerwistProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
