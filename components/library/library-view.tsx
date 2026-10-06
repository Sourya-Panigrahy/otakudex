"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLoginModal } from "@/components/auth";
import { useSession } from "next-auth/react";
import { Check, Clock, Film, RefreshCw, Tv } from "lucide-react";

import { EpisodeWatchedInline } from "@/components/anime/episode-watched-inline";
import { MalImportCard } from "@/components/library/cards/mal-import-card";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_MINUTES_PER_EPISODE } from "@/lib/jikan-duration";
import { type EntryStatus } from "@/lib/entry-status";
import { cn } from "@/lib/utils";

export type UniversalItem = {
  id: string;
  source: "anime_entry" | "media_entry";
  mediaType: "anime" | "movie" | "tv" | "web_series";
  externalId: string;
  status: string;
  progress: number;
  totalProgress: number | null;
  title: string;
  imageUrl: string | null;
  genres: string[];
  airStatus: string | null;
  minutesPerEpisode: number | null;
  rating?: number | null;
  detailHref: string;
  malId?: number;
};

type LibraryTab = "overview" | EntryStatus;
type MediaFilter = "all" | "anime" | "movie" | "tv";

const TAB_ORDER: LibraryTab[] = [
  "overview",
  "plan_to_watch",
  "watching",
  "on_hold",
  "completed",
];

const TAB_LABEL: Record<LibraryTab, string> = {
  overview: "Overview",
  plan_to_watch: "Plan to Watch",
  watching: "Watching",
  on_hold: "On hold",
  completed: "Watched",
};

const MEDIA_FILTERS: Array<{ id: MediaFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "anime", label: "Anime" },
  { id: "movie", label: "Movies" },
  { id: "tv", label: "TV & Shows" },
];

function parseGenres(json: string | null): string[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function progressBarPercent(progress: number, total: number | null): number {
  if (total != null && total > 0) {
    return Math.min(100, Math.round((progress / total) * 100));
  }
  if (progress > 0) return 15;
  return 0;
}

function tvTimeBreakdown(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return { months: 0, days: 0, hours: 0 };
  }
  const MONTH_MIN = 30 * 24 * 60;
  const DAY_MIN = 24 * 60;
  let m = Math.floor(totalMinutes);
  const months = Math.floor(m / MONTH_MIN);
  m %= MONTH_MIN;
  const days = Math.floor(m / DAY_MIN);
  m %= DAY_MIN;
  const hours = Math.floor(m / 60);
  return { months, days, hours };
}

export function LibraryView() {
  const { openLoginModal } = useLoginModal();
  const { data: session, status } = useSession();

  const [items, setItems] = useState<UniversalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<LibraryTab>("watching");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const [animeRes, mediaRes] = await Promise.allSettled([
        fetch("/api/entries", { cache: "no-store" }),
        fetch("/api/media/entries", { cache: "no-store" }),
      ]);

      const unified: UniversalItem[] = [];

      // Process Anime entries
      if (animeRes.status === "fulfilled" && animeRes.value.ok) {
        const json = await animeRes.value.json();
        for (const row of json.entries ?? []) {
          unified.push({
            id: row.id,
            source: "anime_entry",
            mediaType: "anime",
            externalId: String(row.malId),
            status: row.status,
            progress: row.watchedEpisodes,
            totalProgress: row.totalEpisodes,
            title: row.titleEn || row.titleDefault || `Anime #${row.malId}`,
            imageUrl: row.imageUrl,
            genres: parseGenres(row.genresJson),
            airStatus: row.airStatus,
            minutesPerEpisode: row.minutesPerEpisode,
            detailHref: `/anime/${row.malId}`,
            malId: row.malId,
          });
        }
      }

      // Process Universal Media entries (movies, tv, web series)
      if (mediaRes.status === "fulfilled" && mediaRes.value.ok) {
        const json = await mediaRes.value.json();
        for (const row of json.entries ?? []) {
          unified.push({
            id: row.id,
            source: "media_entry",
            mediaType: row.mediaType,
            externalId: String(row.externalId),
            status: row.status,
            progress: row.progress,
            totalProgress: row.totalProgress,
            title: row.titleEn || row.titleDefault || `Media #${row.externalId}`,
            imageUrl: row.imageUrl,
            genres: parseGenres(row.genresJson),
            airStatus: row.airStatus,
            minutesPerEpisode: row.minutesPerEpisode,
            rating: row.rating,
            detailHref:
              row.mediaType === "movie"
                ? `/movies/${row.externalId}`
                : `/movies/${row.externalId}`,
          });
        }
      }

      setItems(unified);
    } catch {
      setError("Could not load your list.");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (tab === "overview") return [];
    return items.filter((item) => {
      const statusMatches = item.status === tab;
      if (!statusMatches) return false;

      if (mediaFilter === "anime") return item.mediaType === "anime";
      if (mediaFilter === "movie") return item.mediaType === "movie";
      if (mediaFilter === "tv")
        return item.mediaType === "tv" || item.mediaType === "web_series";
      return true;
    });
  }, [items, tab, mediaFilter]);

  const overviewStats = useMemo(() => {
    let seriesEpisodes = 0;
    let seriesMinutes = 0;
    let moviesWatched = 0;
    let movieMinutes = 0;
    let usedDefaultLength = 0;

    for (const e of items) {
      if (e.mediaType === "movie") {
        if (e.status === "completed" || e.progress > 0) {
          moviesWatched += 1;
          const runtime =
            e.minutesPerEpisode && e.minutesPerEpisode > 0
              ? e.minutesPerEpisode
              : 110;
          movieMinutes += runtime;
        }
      } else {
        seriesEpisodes += e.progress;
        const per =
          e.minutesPerEpisode != null && e.minutesPerEpisode > 0
            ? e.minutesPerEpisode
            : DEFAULT_MINUTES_PER_EPISODE;
        if (e.minutesPerEpisode == null || e.minutesPerEpisode <= 0) {
          if (e.progress > 0) usedDefaultLength += 1;
        }
        seriesMinutes += e.progress * per;
      }
    }

    return {
      seriesEpisodes,
      seriesMinutes,
      seriesHours: Math.round((seriesMinutes / 60) * 10) / 10,
      moviesWatched,
      movieMinutes,
      movieHours: Math.round((movieMinutes / 60) * 10) / 10,
      usedDefaultLength,
    };
  }, [items]);

  const seriesBreakdown = useMemo(
    () => tvTimeBreakdown(overviewStats.seriesMinutes),
    [overviewStats.seriesMinutes]
  );

  const movieBreakdown = useMemo(
    () => tvTimeBreakdown(overviewStats.movieMinutes),
    [overviewStats.movieMinutes]
  );

  const patchAnime = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "Could not update entry.");
        return false;
      }
      if (json.entry) {
        setItems((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: json.entry.status,
                  progress: json.entry.watchedEpisodes,
                  totalProgress: json.entry.totalEpisodes,
                }
              : e
          )
        );
      }
      return true;
    } finally {
      setBusyId(null);
    }
  };

  const patchMedia = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/media/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "Could not update entry.");
        return false;
      }
      if (json.entry) {
        setItems((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: json.entry.status,
                  progress: json.entry.progress,
                  totalProgress: json.entry.totalProgress,
                }
              : e
          )
        );
      }
      return true;
    } finally {
      setBusyId(null);
    }
  };

  if (status === "loading" || loading) {
    return <p className="text-sm text-zinc-500">Loading your list…</p>;
  }

  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center">
        <p className="text-zinc-300">
          Sign in to view and manage your library.
        </p>
        <button
          type="button"
          className="mt-4 rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          onClick={openLoginModal}
        >
          Sign in
        </button>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Top Controls: Status Tabs & Media Type Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1 shadow-inner">
            {TAB_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm",
                  tab === t
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {TAB_LABEL[t]}
              </button>
            ))}
          </div>

          {/* Media Type Filter Pills (when not overview) */}
          {tab !== "overview" && (
            <div className="flex items-center gap-1 pl-1">
              {MEDIA_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMediaFilter(f.id)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    mediaFilter === f.id
                      ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs tabular-nums text-muted-foreground sm:text-sm">
          {tab === "overview" ? (
            <>
              {items.length} {items.length === 1 ? "title" : "titles"} in your
              library
            </>
          ) : (
            <>
              {filtered.length} {filtered.length === 1 ? "title" : "titles"} |{" "}
              {items.length} total
            </>
          )}
        </p>
      </div>

      {actionError ? (
        <p
          className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}

      {tab === "overview" ? (
        <div className="space-y-6">
          <MalImportCard onImported={() => void load()} />

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add anime from Search or movies from Movies to start tracking.
            </p>
          ) : (
            <>
              <div className="space-y-6">
                {/* 1. Anime & TV Series Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tv className="size-4 text-cyan-400" strokeWidth={2} />
                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Anime & Series Stats
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card className="rounded-xl border-border/80 bg-card shadow-sm">
                      <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border pb-3">
                        <Tv className="size-4 shrink-0 text-cyan-400" strokeWidth={1.75} />
                        <span className="font-semibold text-foreground text-sm">Series Watch Time</span>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {(
                            [
                              ["Months", seriesBreakdown.months],
                              ["Days", seriesBreakdown.days],
                              ["Hours", seriesBreakdown.hours],
                            ] as const
                          ).map(([label, value]) => (
                            <div key={label} className="flex flex-col items-center">
                              <p className="font-heading text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                                {value.toLocaleString()}
                              </p>
                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {label}
                              </p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 text-center text-[11px] text-muted-foreground">
                          Estimated from episode runtimes (~30-day months).
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl border-border/80 bg-card shadow-sm">
                      <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border pb-3">
                        <Tv className="size-4 shrink-0 text-foreground" strokeWidth={1.75} />
                        <span className="font-semibold text-foreground text-sm">Episodes Watched</span>
                      </CardHeader>
                      <CardContent className="flex min-h-[140px] items-center justify-center py-6">
                        <p className="font-heading text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
                          {overviewStats.seriesEpisodes.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* 2. Movies Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Film className="size-4 text-amber-400" strokeWidth={2} />
                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Movies Stats
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card className="rounded-xl border-border/80 bg-card shadow-sm">
                      <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border pb-3">
                        <Film className="size-4 shrink-0 text-amber-400" strokeWidth={1.75} />
                        <span className="font-semibold text-foreground text-sm">Movie Watch Time</span>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {(
                            [
                              ["Months", movieBreakdown.months],
                              ["Days", movieBreakdown.days],
                              ["Hours", movieBreakdown.hours],
                            ] as const
                          ).map(([label, value]) => (
                            <div key={label} className="flex flex-col items-center">
                              <p className="font-heading text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                                {value.toLocaleString()}
                              </p>
                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {label}
                              </p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 text-center text-[11px] text-muted-foreground">
                          Estimated from movie runtimes ({overviewStats.movieHours.toLocaleString()} total hours).
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-xl border-border/80 bg-card shadow-sm">
                      <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border pb-3">
                        <Film className="size-4 shrink-0 text-foreground" strokeWidth={1.75} />
                        <span className="font-semibold text-foreground text-sm">Movies Watched</span>
                      </CardHeader>
                      <CardContent className="flex min-h-[140px] items-center justify-center py-6">
                        <p className="font-heading text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
                          {overviewStats.moviesWatched.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            Nothing in this list yet.
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Browse anime or movies to add titles to your list.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {filtered.map((e) => {
            const isMovie = e.mediaType === "movie";
            const isAiring = e.airStatus === "Currently Airing" || e.airStatus === "Returning Series";
            const pct = progressBarPercent(e.progress, e.totalProgress);

            return (
              <li key={e.id} className="list-none">
                <Card className="group/poster h-full gap-0 overflow-hidden rounded-xl border-border/60 bg-card p-0 shadow-sm ring-1 ring-border/25 transition-all hover:shadow-md hover:border-cyan-500/30">
                  <div className="relative aspect-[2/3] w-full bg-muted">
                    <Link
                      href={e.detailHref}
                      className="absolute inset-0 block outline-none focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
                    >
                      {e.imageUrl ? (
                        <Image
                          src={e.imageUrl}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-300 ease-out group-hover/poster:scale-[1.03]"
                          sizes="(max-width: 640px) 45vw, 140px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-muted-foreground">
                          No image
                        </div>
                      )}
                    </Link>

                    {/* Airing badge */}
                    {isAiring ? (
                      <Badge
                        variant="airing"
                        className="pointer-events-none absolute left-1.5 top-1.5 z-10 px-1.5 py-0 text-[8px] leading-tight"
                      >
                        Airing
                      </Badge>
                    ) : null}

                    {/* Media Type badge */}
                    <div className="pointer-events-none absolute right-1.5 top-1.5 z-10">
                      <span className="rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-zinc-300 backdrop-blur-md">
                        {isMovie ? "Movie" : e.mediaType === "tv" ? "TV" : "Anime"}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div
                    className="h-1 w-full bg-muted"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full transition-[width] duration-300 ease-out ${
                        isMovie ? "bg-cyan-400" : "bg-amber-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="space-y-2 p-2">
                    <Link
                      href={e.detailHref}
                      className="line-clamp-2 text-left text-[11px] font-medium leading-snug text-foreground transition-colors hover:text-primary"
                    >
                      {e.title}
                    </Link>

                    {/* Movie specific action */}
                    {isMovie ? (
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <span className="text-[10px] text-zinc-400">
                          {e.minutesPerEpisode ? `${e.minutesPerEpisode}m` : "Movie"}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          disabled={busyId === e.id}
                          className={`text-[11px] px-2 py-1 h-6 font-medium ${
                            e.status === "completed"
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                              : "border-white/10 text-zinc-300 hover:text-white"
                          }`}
                          onClick={() => {
                            const nextStatus = e.status === "completed" ? "plan_to_watch" : "completed";
                            void patchMedia(e.id, {
                              status: nextStatus,
                              progress: nextStatus === "completed" ? 1 : 0,
                            });
                          }}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          <span>{e.status === "completed" ? "Seen" : "Mark seen"}</span>
                        </Button>
                      </div>
                    ) : (
                      /* Episodic show / Anime progress buttons */
                      <div
                        className="flex items-center justify-center gap-0.5"
                        onClick={(ev) => ev.stopPropagation()}
                        onPointerDown={(ev) => ev.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          disabled={busyId === e.id || e.progress <= 0}
                          className="size-7 shrink-0 rounded-md"
                          aria-label="Decrease watched episodes"
                          onClick={(ev) => {
                            ev.preventDefault();
                            if (e.source === "anime_entry") {
                              void patchAnime(e.id, {
                                watched_episodes: e.progress - 1,
                              });
                            } else {
                              void patchMedia(e.id, {
                                progress: e.progress - 1,
                              });
                            }
                          }}
                        >
                          −
                        </Button>
                        <div className="min-w-0 flex-1 px-0.5 text-center">
                          <EpisodeWatchedInline
                            watchedEpisodes={e.progress}
                            totalEpisodes={e.totalProgress}
                            disabled={busyId === e.id}
                            size="sm"
                            onCommit={(n) => {
                              if (e.source === "anime_entry") {
                                void patchAnime(e.id, { watched_episodes: n });
                              } else {
                                void patchMedia(e.id, { progress: n });
                              }
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          disabled={
                            busyId === e.id ||
                            (e.totalProgress != null &&
                              e.progress >= e.totalProgress)
                          }
                          className="size-7 shrink-0 rounded-md"
                          aria-label="Increase watched episodes"
                          onClick={(ev) => {
                            ev.preventDefault();
                            if (e.source === "anime_entry") {
                              void patchAnime(e.id, {
                                watched_episodes: e.progress + 1,
                              });
                            } else {
                              void patchMedia(e.id, {
                                progress: e.progress + 1,
                              });
                            }
                          }}
                        >
                          +
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
