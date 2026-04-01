"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export function SiteHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-5 sm:py-3 lg:px-8">
        <Link
          href="/"
          className="shrink-0 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Anime tracker
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-5 sm:text-sm text-xs font-medium">
          <Link
            className="shrink-0 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            href="/"
          >
            Search
          </Link>
          <Link
            className="shrink-0 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            href="/library"
          >
            <span className="hidden sm:inline">My list</span>
            <span className="sm:hidden">List</span>
          </Link>
          {status === "authenticated" ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full"
                />
              ) : null}
              <button
                type="button"
                className="shrink-0 rounded-full border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-700 transition hover:bg-zinc-100 sm:px-3 sm:text-sm dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="rounded-full bg-zinc-900 px-3 py-1.5 text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              onClick={() => signIn("github")}
            >
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
