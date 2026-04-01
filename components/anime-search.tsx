"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";

import type { AnimeListDto } from "@/lib/jikan";
import {
  ENTRY_STATUS_LABEL,
  type EntryStatus,
} from "@/lib/entry-status";

type EntryRow = {
  id: string;
  malId: number;
  status: string;
};

export type AnimeSearchDiscover = {
  now: AnimeListDto[];
  upcoming: AnimeListDto[];
};

type AnimeSearchProps = {
  discover?: AnimeSearchDiscover;
};

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function AnimeSearch({ discover }: AnimeSearchProps) {
  const { data: session, status } = useSession();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 350);
  const [results, setResults] = useState<AnimeListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [byMalId, setByMalId] = useState<Map<number, EntryRow>>(new Map());
  const [pendingMal, setPendingMal] = useState<number | null>(null);

  const loadEntries = useCallback(async () => {
    if (!session?.user?.id) {
      setByMalId(new Map());
      return;
    }
    const res = await fetch("/api/entries");
    if (!res.ok) return;
    const json = (await res.json()) as {
      entries: Array<{
        id: string;
        malId: number;
        status: string;
      }>;
    };
    const m = new Map<number, EntryRow>();
    for (const e of json.entries) {
      m.set(e.malId, { id: e.id, malId: e.malId, status: e.status });
    }
    setByMalId(m);
  }, [session?.user?.id]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await fetch(
          `/api/anime/search?q=${encodeURIComponent(debounced.trim())}`
        );
        if (!res.ok) throw new Error("Search failed");
        const json = (await res.json()) as { data: AnimeListDto[] };
        if (!cancelled) setResults(json.data ?? []);
      } catch {
        if (!cancelled) {
          setError("Could not load results. Try again.");
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const signedIn = status === "authenticated";

  const add = async (malId: number, statusChoice: EntryStatus) => {
    if (!signedIn) {
      void signIn("github");
      return;
    }
    setPendingMal(malId);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mal_id: malId, status: statusChoice }),
      });
      const json = (await res.json()) as {
        entry?: { id: string; malId: number; status: string };
        error?: string;
      };
      if (res.status === 409 && json.entry) {
        setByMalId((prev) => {
          const next = new Map(prev);
          next.set(malId, {
            id: json.entry!.id,
            malId,
            status: json.entry!.status,
          });
          return next;
        });
        return;
      }
      if (!res.ok) return;
      if (json.entry) {
        setByMalId((prev) => {
          const next = new Map(prev);
          next.set(malId, {
            id: json.entry!.id,
            malId,
            status: json.entry!.status,
          });
          return next;
        });
      }
    } finally {
      setPendingMal(null);
    }
  };

  const hint = useMemo(() => {
    if (!query.trim()) {
      return discover?.now.length || discover?.upcoming.length
        ? "Browse this season and upcoming below, or search by title."
        : "Type an anime title to search Jikan.";
    }
    if (loading) return "Searching…";
    return null;
  }, [query, loading, discover?.now.length, discover?.upcoming.length]);

  const searching = Boolean(debounced.trim());
  const showDiscover =
    !searching &&
    discover &&
    (discover.now.length > 0 || discover.upcoming.length > 0);

  const renderCard = (a: AnimeListDto, listKey: string) => {
    const existing = byMalId.get(a.mal_id);
    return (
      <li
        key={`${listKey}-${a.mal_id}`}
        className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Link
          href={`/anime/${a.mal_id}`}
          className="block flex-1 outline-none ring-zinc-400 focus-visible:ring-2"
        >
          <div className="relative aspect-2/3 w-full bg-zinc-100 dark:bg-zinc-800">
            {a.image_url ? (
              <Image
                src={a.image_url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 399px) 100vw, (max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 16vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                No image
              </div>
            )}
          </div>
          <div className="flex flex-col gap-0.5 p-2.5 sm:p-3">
            <div>
              <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-900 sm:text-base dark:text-zinc-50">
                {a.title_english || a.title}
              </p>
              {a.title_english ? (
                <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500 sm:text-xs dark:text-zinc-400">
                  {a.title}
                </p>
              ) : null}
              {a.episodes != null ? (
                <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
                  {a.episodes} eps
                </p>
              ) : null}
            </div>
          </div>
        </Link>
        <div className="flex flex-col gap-2 px-2.5 pb-2.5 sm:gap-3 sm:px-3 sm:pb-3">
          {existing ? (
            <p className="text-xs text-zinc-600 sm:text-sm dark:text-zinc-300">
              On your list:{" "}
              <span className="font-medium">
                {ENTRY_STATUS_LABEL[
                  existing.status as keyof typeof ENTRY_STATUS_LABEL
                ] ?? existing.status}
              </span>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 min-[400px]:grid-cols-3 sm:flex sm:flex-wrap sm:gap-2">
              {(["plan_to_watch", "watching", "completed"] as const).map(
                (s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={pendingMal === a.mal_id}
                    className="rounded-lg border border-zinc-200 px-2 py-1.5 text-[11px] font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 sm:px-2.5 sm:text-xs dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    onClick={() => void add(a.mal_id, s)}
                  >
                    {ENTRY_STATUS_LABEL[s]}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </li>
    );
  };

  const gridClass =
    "grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div>
        <label className="sr-only" htmlFor="anime-q">
          Search anime
        </label>
        <input
          id="anime-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title…"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 shadow-sm outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2 sm:rounded-xl sm:px-4 sm:py-3 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {hint ? (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : null}
      </div>

      {showDiscover ? (
        <div className="flex flex-col gap-6 sm:gap-8">
          {discover!.now.length > 0 ? (
            <section className="flex flex-col gap-3 sm:gap-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
                  This season
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm dark:text-zinc-400">
                  Currently airing from Jikan’s “seasons now” list.
                </p>
              </div>
              <ul className={gridClass}>
                {discover!.now.map((a) => renderCard(a, "now"))}
              </ul>
            </section>
          ) : null}
          {discover!.upcoming.length > 0 ? (
            <section className="flex flex-col gap-3 sm:gap-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
                  Upcoming
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500 sm:mt-1 sm:text-sm dark:text-zinc-400">
                  Next season announcements from Jikan.
                </p>
              </div>
              <ul className={gridClass}>
                {discover!.upcoming.map((a) => renderCard(a, "up"))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      {searching ? (
        <section className="flex flex-col gap-3 sm:gap-4">
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
            Search results
          </h2>
          {results.length === 0 && !loading && !error ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No matches. Try another title.
            </p>
          ) : (
            <ul className={gridClass}>
              {results.map((a) => renderCard(a, "search"))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
