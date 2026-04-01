"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";

import {
  ENTRY_STATUS_LABEL,
  type EntryStatus,
} from "@/lib/entry-status";

export type EntryDto = {
  id: string;
  userId: string;
  malId: number;
  status: string;
  watchedEpisodes: number;
  totalEpisodes: number | null;
  titleEn: string | null;
  titleDefault: string | null;
  imageUrl: string | null;
  updatedAt: string;
};

const TABS: EntryStatus[] = ["plan_to_watch", "watching", "completed"];

export function LibraryView() {
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<EntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<EntryStatus>("watching");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user?.id) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/entries");
      if (!res.ok) throw new Error("Failed to load");
      const json = (await res.json()) as { entries: EntryDto[] };
      setEntries(json.entries ?? []);
    } catch {
      setError("Could not load your list.");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => entries.filter((e) => e.status === tab),
    [entries, tab]
  );

  const patch = async (
    id: string,
    body: Record<string, unknown>
  ): Promise<boolean> => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return false;
      const json = (await res.json()) as { entry: EntryDto };
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? json.entry : e))
      );
      return true;
    } finally {
      setBusyId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
    );
  }

  if (!session?.user) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-zinc-700 dark:text-zinc-300">
          Sign in with GitHub to view and manage your anime list.
        </p>
        <button
          type="button"
          className="mt-4 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          onClick={() => signIn("github")}
        >
          Sign in
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              tab === t
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {ENTRY_STATUS_LABEL[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Nothing in this list yet. Add anime from Search.
        </p>
      ) : (
        <ul className="flex flex-col gap-3 sm:gap-4">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 sm:flex-row sm:gap-4 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Link
                href={`/anime/${e.malId}`}
                className="relative mx-auto aspect-2/3 w-full max-w-[120px] shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-zinc-400 outline-none focus-visible:ring-2 sm:mx-0 sm:aspect-auto sm:h-28 sm:w-20 sm:max-w-none dark:bg-zinc-800"
              >
                {e.imageUrl ? (
                  <Image
                    src={e.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">
                    No image
                  </div>
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div>
                  <Link
                    href={`/anime/${e.malId}`}
                    className="font-medium leading-snug text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
                  >
                    {e.titleEn || e.titleDefault || `Anime #${e.malId}`}
                  </Link>
                  {e.titleEn && e.titleDefault ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {e.titleDefault}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 text-sm text-zinc-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 dark:text-zinc-300">
                  <span>
                    Episodes: {e.watchedEpisodes}
                    {e.totalEpisodes != null ? ` / ${e.totalEpisodes}` : " / ?"}
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      disabled={busyId === e.id || e.watchedEpisodes <= 0}
                      className="rounded border border-zinc-300 px-2 py-0.5 text-xs disabled:opacity-40 dark:border-zinc-600"
                      onClick={() =>
                        void patch(e.id, {
                          watched_episodes: e.watchedEpisodes - 1,
                        })
                      }
                    >
                      −
                    </button>
                    <button
                      type="button"
                      disabled={
                        busyId === e.id ||
                        (e.totalEpisodes != null &&
                          e.watchedEpisodes >= e.totalEpisodes)
                      }
                      className="rounded border border-zinc-300 px-2 py-0.5 text-xs disabled:opacity-40 dark:border-zinc-600"
                      onClick={() =>
                        void patch(e.id, {
                          watched_episodes: e.watchedEpisodes + 1,
                        })
                      }
                    >
                      +
                    </button>
                    <button
                      type="button"
                      disabled={busyId === e.id}
                      className="ml-0 text-xs text-zinc-500 underline hover:text-zinc-800 sm:ml-2 dark:hover:text-zinc-200"
                      onClick={() =>
                        void patch(e.id, { refresh_from_jikan: true })
                      }
                    >
                      <span className="hidden sm:inline">Refresh from Jikan</span>
                      <span className="sm:hidden">Refresh</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TABS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busyId === e.id || e.status === s}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200"
                      onClick={() => void patch(e.id, { status: s })}
                    >
                      {ENTRY_STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
