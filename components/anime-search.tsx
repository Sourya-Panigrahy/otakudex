"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLoginModal } from "@/components/login-modal";
import { useSession } from "next-auth/react";

import {
  AnimeBrowseCard,
  type ListEntryRow,
} from "@/components/anime-browse-card";
import { ANIME_BROWSE_GRID_CLASS } from "@/components/anime-browse-grid";
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
      return discover?.now.length || discover?.upcoming.length
        ? "Browse seasonal hits and upcoming below, or use the header search."
        : "Use the header search to find titles.";
    }
    if (loading) return "Searching…";
    return null;
  }, [query, loading, discover?.now.length, discover?.upcoming.length]);

  const searching = Boolean(debounced.trim());
  const showDiscover =
    !searching &&
    discover &&
    (discover.now.length > 0 || discover.upcoming.length > 0);

  const nowLen = discover?.now.length ?? 0;

  const priorityFor = (listKey: string, index: number) =>
    (listKey === "now" && index < 6) ||
    (listKey === "search" && searching && index < 6) ||
    (listKey === "up" && nowLen === 0 && index < 6);

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
        <div className="flex flex-col gap-6 sm:gap-8">
          {discover!.now.length > 0 ? (
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
                {discover!.now.map((a, i) => (
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
            </section>
          ) : null}
          {discover!.upcoming.length > 0 ? (
            <section className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-zinc-50 sm:text-lg">
                    Upcoming
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
                {discover!.upcoming.map((a, i) => (
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
