import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Otaku Dex",
  description:
    "Search Jikan, track plan to watch / watching / watched, and episode progress.",
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
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-zinc-950 font-sans text-zinc-100">
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
      </body>
    </html>
  );
}
