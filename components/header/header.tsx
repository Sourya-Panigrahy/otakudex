"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useLoginModal } from "@/components/auth";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

import { HeaderSearch } from "@/components/header/header-search";

export function Header() {
  const { openLoginModal } = useLoginModal();
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const browseActive = pathname === "/";
  const listActive = pathname === "/library";

  const actions = (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <button
        type="button"
        className="hidden rounded-full p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white sm:inline-flex"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
      </button>
      {status === "authenticated" ? (
        <>
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full border border-white/20"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-medium text-zinc-200">
              {(session?.user?.name ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <button
            type="button"
            className="rounded-lg border border-white/25 px-3 py-2 text-xs font-medium text-zinc-100 transition hover:bg-white/10 sm:text-sm"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          type="button"
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-400"
          onClick={openLoginModal}
        >
          Join
        </button>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/15 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/10">
      <div className="mx-auto grid max-w-[1920px] grid-cols-1 gap-4 px-4 py-3 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,22rem)_auto] lg:items-center lg:gap-6 lg:px-10 xl:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="shrink-0 text-lg font-bold tracking-tight sm:text-xl"
          >
            <span className="text-cyan-400">OTAKU</span>{" "}
            <span className="text-zinc-100">DEX</span>
          </Link>
          <div className="lg:hidden">{actions}</div>
        </div>

        <nav className="flex min-w-0 items-center gap-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] lg:justify-center [&::-webkit-scrollbar]:hidden">
          <Link
            href="/"
            className={`relative shrink-0 px-2.5 py-2 text-sm font-medium transition sm:px-3 ${
              browseActive
                ? "text-cyan-400 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-cyan-400 sm:after:left-3 sm:after:right-3"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            Browse
          </Link>
          <Link
            href="/#seasonal"
            className="shrink-0 px-2.5 py-2 text-sm font-medium text-zinc-300 transition hover:text-white sm:px-3"
          >
            Seasonal
          </Link>
          <Link
            href="/library"
            className={`relative shrink-0 px-2.5 py-2 text-sm font-medium transition sm:px-3 ${
              listActive
                ? "text-cyan-400 after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:rounded-full after:bg-cyan-400 sm:after:left-3 sm:after:right-3"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            My List
          </Link>
          <Link
            href="#community"
            className="hidden shrink-0 px-2.5 py-2 text-sm font-medium text-zinc-300 transition hover:text-white sm:inline sm:px-3"
          >
            Community
          </Link>
        </nav>

        <div className="min-w-0">
          <HeaderSearch />
        </div>

        <div className="hidden lg:block">{actions}</div>
      </div>
    </header>
  );
}
