"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useLoginModal } from "@/components/auth";
import { useSession } from "next-auth/react";

import {
  AnimeBrowseCard,
  type ListEntryRow,
} from "@/components/anime/cards/anime-browse-card";
import { ANIME_BROWSE_GRID_CLASS } from "@/components/anime/cards/anime-browse-grid";
import type { AnimeListDto } from "@/lib/jikan";
import type { EntryStatus } from "@/lib/entry-status";

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
  const { openLoginModal } = useLoginModal();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const debounced = useDebouncedValue(query, 350);
  const [results, setResults] = useState<AnimeListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [byMalId, setByMalId] = useState<Map<number, ListEntryRow>>(new Map());
  const [pendingMal, setPendingMal] = useState<number | null>(null);

  // Paginated/lazy-loaded items for Seasonal
  const [nowList, setNowList] = useState<AnimeListDto[]>(discover?.now ?? []);
  const [nowPage, setNowPage] = useState(1);
  const [nowLoadingMore, setNowLoadingMore] = useState(false);
  const [nowHasMore, setNowHasMore] = useState(true);

  // Paginated/lazy-loaded items for Upcoming
  const [upcomingList, setUpcomingList] = useState<AnimeListDto[]>(
    discover?.upcoming ?? []
  );
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [upcomingLoadingMore, setUpcomingLoadingMore] = useState(false);
  const [upcomingHasMore, setUpcomingHasMore] = useState(true);

  useEffect(() => {
    if (discover?.now) setNowList(discover.now);
    if (discover?.upcoming) setUpcomingList(discover.upcoming);
  }, [discover?.now, discover?.upcoming]);

  const loadMoreNow = async () => {
    if (nowLoadingMore || !nowHasMore) return;
    setNowLoadingMore(true);
    try {
      const nextPage = nowPage + 1;
      const res = await fetch(`/api/anime/seasons?kind=now&page=${nextPage}`);
      if (!res.ok) return;
      const json = (await res.json()) as {
        data: AnimeListDto[];
        hasNextPage: boolean;
      };
      if (json.data?.length) {
        setNowList((prev) => {
          const ids = new Set(prev.map((x) => x.mal_id));
          const uniqueNew = json.data.filter((x) => !ids.has(x.mal_id));
          return [...prev, ...uniqueNew];
        });
        setNowPage(nextPage);
        setNowHasMore(Boolean(json.hasNextPage));
      } else {
        setNowHasMore(false);
      }
    } catch {
      // Keep state on network failure
    } finally {
      setNowLoadingMore(false);
    }
  };

  const loadMoreUpcoming = async () => {
    if (upcomingLoadingMore || !upcomingHasMore) return;
    setUpcomingLoadingMore(true);
    try {
      const nextPage = upcomingPage + 1;
      const res = await fetch(`/api/anime/seasons?kind=upcoming&page=${nextPage}`);
      if (!res.ok) return;
      const json = (await res.json()) as {
        data: AnimeListDto[];
        hasNextPage: boolean;
      };
      if (json.data?.length) {
        setUpcomingList((prev) => {
          const ids = new Set(prev.map((x) => x.mal_id));
          const uniqueNew = json.data.filter((x) => !ids.has(x.mal_id));
          return [...prev, ...uniqueNew];
        });
        setUpcomingPage(nextPage);
        setUpcomingHasMore(Boolean(json.hasNextPage));
      } else {
        setUpcomingHasMore(false);
      }
    } catch {
      // Keep state on network failure
    } finally {
      setUpcomingLoadingMore(false);
    }
  };

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
    const m = new Map<number, ListEntryRow>();
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
      openLoginModal();
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
      return nowList.length || upcomingList.length
        ? "Browse seasonal hits and upcoming below, or use the header search."
        : "Use the header search to find titles.";
    }
    if (loading) return "Searching…";
    return null;
  }, [query, loading, nowList.length, upcomingList.length]);

  const searching = Boolean(debounced.trim());
  const showDiscover =
    !searching &&
    (nowList.length > 0 || upcomingList.length > 0);

  const priorityFor = (listKey: string, index: number) =>
    (listKey === "now" && index < 6) ||
    (listKey === "search" && searching && index < 6) ||
    (listKey === "up" && nowList.length === 0 && index < 6);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div>
        {hint ? (
          <p className="text-sm text-zinc-500">{hint}</p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        ) : null}
      </div>

      {showDiscover ? (
        <div className="flex flex-col gap-8 sm:gap-10">
          {nowList.length > 0 ? (
            <section
              id="seasonal"
              className="flex scroll-mt-28 flex-col gap-3 sm:gap-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-zinc-50 sm:text-lg">
                    Seasonal hits
                  </h2>
                </div>
                <Link
                  href="/discover/seasonal"
                  className="shrink-0 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                  View all
                </Link>
              </div>
              <ul className={ANIME_BROWSE_GRID_CLASS}>
                {nowList.map((a, i) => (
                  <AnimeBrowseCard
                    key={`now-${a.mal_id}`}
                    anime={a}
                    priority={priorityFor("now", i)}
                    existing={byMalId.get(a.mal_id)}
                    isPending={pendingMal === a.mal_id}
                    onAdd={add}
                  />
                ))}
              </ul>
              {nowHasMore ? (
                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    disabled={nowLoadingMore}
                    onClick={loadMoreNow}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-xs font-semibold text-zinc-200 backdrop-blur transition hover:border-white/25 hover:bg-white/10 active:scale-95 disabled:opacity-50 sm:text-sm"
                  >
                    {nowLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                        Loading more…
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 text-cyan-400" />
                        Load more seasonal
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          {upcomingList.length > 0 ? (
            <section className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-zinc-50 sm:text-lg">
                    Upcoming (next months)
                  </h2>
                </div>
                <Link
                  href="/discover/upcoming"
                  className="shrink-0 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                  View all
                </Link>
              </div>
              <ul className={ANIME_BROWSE_GRID_CLASS}>
                {upcomingList.map((a, i) => (
                  <AnimeBrowseCard
                    key={`up-${a.mal_id}`}
                    anime={a}
                    priority={priorityFor("up", i)}
                    existing={byMalId.get(a.mal_id)}
                    isPending={pendingMal === a.mal_id}
                    onAdd={add}
                  />
                ))}
              </ul>
              {upcomingHasMore ? (
                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    disabled={upcomingLoadingMore}
                    onClick={loadMoreUpcoming}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-2.5 text-xs font-semibold text-zinc-200 backdrop-blur transition hover:border-white/25 hover:bg-white/10 active:scale-95 disabled:opacity-50 sm:text-sm"
                  >
                    {upcomingLoadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                        Loading more…
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 text-cyan-400" />
                        Load more upcoming
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}

      {searching ? (
        <section className="flex flex-col gap-3 sm:gap-4">
          <h2 className="text-base font-semibold text-zinc-50 sm:text-lg">
            Search results
          </h2>
          {results.length === 0 && !loading && !error ? (
            <p className="text-sm text-zinc-500">
              No matches. Try another title.
            </p>
          ) : (
            <ul className={ANIME_BROWSE_GRID_CLASS}>
              {results.map((a, i) => (
                <AnimeBrowseCard
                  key={`search-${a.mal_id}`}
                  anime={a}
                  priority={priorityFor("search", i)}
                  existing={byMalId.get(a.mal_id)}
                  isPending={pendingMal === a.mal_id}
                  onAdd={add}
                />
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
