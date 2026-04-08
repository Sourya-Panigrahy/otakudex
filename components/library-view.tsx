"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLoginModal } from "@/components/login-modal";
import { useSession } from "next-auth/react";
import { RefreshCw, Tv } from "lucide-react";

import { EpisodeWatchedInline } from "@/components/episode-watched-inline";
import { MalImportCard } from "@/components/mal-import-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_MINUTES_PER_EPISODE } from "@/lib/jikan-duration";
import { type EntryStatus } from "@/lib/entry-status";
import { cn } from "@/lib/utils";

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
  genresJson: string | null;
  mediaType: string | null;
  airStatus: string | null;
  minutesPerEpisode: number | null;
  updatedAt: string;
};

type LibraryTab = "overview" | EntryStatus;

const TAB_ORDER: LibraryTab[] = [
  "overview",
  "plan_to_watch",
  "watching",
  "on_hold",
  "completed",
];

/** Tab labels aligned with the library mock (title case). */
const TAB_LABEL: Record<LibraryTab, string> = {
  overview: "Overview",
  plan_to_watch: "Plan to Watch",
  watching: "Watching",
  on_hold: "On hold",
  completed: "Watched",
};

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

function progressBarPercent(
  watched: number,
  total: number | null
): number {
  if (total != null && total > 0) {
    return Math.min(100, Math.round((watched / total) * 100));
  }
  if (watched > 0) return 12;
  return 0;
}

/** ~30-day months; remainder → days → hours (for overview display). */
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
  const [entries, setEntries] = useState<EntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<LibraryTab>("watching");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user?.id) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/entries", { cache: "no-store" });
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

  const filtered = useMemo(() => {
    if (tab === "overview") return [];
    return entries.filter((e) => e.status === tab);
  }, [entries, tab]);

  const overviewStats = useMemo(() => {
    let episodes = 0;
    let minutes = 0;
    let usedDefaultLength = 0;
    for (const e of entries) {
      episodes += e.watchedEpisodes;
      const per =
        e.minutesPerEpisode != null && e.minutesPerEpisode > 0
          ? e.minutesPerEpisode
          : DEFAULT_MINUTES_PER_EPISODE;
      if (e.minutesPerEpisode == null || e.minutesPerEpisode <= 0) {
        if (e.watchedEpisodes > 0) usedDefaultLength += 1;
      }
      minutes += e.watchedEpisodes * per;
    }
    return {
      episodes,
      minutes,
      hours: minutes / 60,
      days: minutes / (60 * 24),
      usedDefaultLength,
    };
  }, [entries]);

  const tvBreakdown = useMemo(
    () => tvTimeBreakdown(overviewStats.minutes),
    [overviewStats.minutes]
  );

  const patch = async (
    id: string,
    body: Record<string, unknown>
  ): Promise<boolean> => {
    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { entry?: EntryDto; error?: string };
      if (!res.ok) {
        setActionError(json.error ?? "Could not update entry.");
        return false;
      }
      if (json.entry) {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? json.entry! : e))
        );
      }
      return true;
    } finally {
      setBusyId(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <p className="text-sm text-zinc-500">Loading…</p>
    );
  }

  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center">
        <p className="text-zinc-300">
          Sign in to view and manage your anime list.
        </p>
        <button
          type="button"
          className="mt-4 rounded-xl border border-sky-500/50 bg-sky-500/10 px-5 py-2.5 text-sm font-medium text-sky-300 transition hover:bg-sky-500/20"
          onClick={openLoginModal}
        >
          Sign in
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-400">{error}</p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-1.5 shadow-inner">
          {TAB_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-all",
                tab === t
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
        <p className="text-sm tabular-nums text-muted-foreground">
          {tab === "overview" ? (
            <>
              {entries.length} {entries.length === 1 ? "title" : "titles"} in
              your list
            </>
          ) : (
            <>
              {filtered.length}{" "}
              {filtered.length === 1 ? "title" : "titles"} | {entries.length}{" "}
              total
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
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add anime from Search or import a MyAnimeList export above to see
              watch time totals here.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="rounded-lg border-border/80 bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border pb-3">
                    <Tv
                      className="size-5 shrink-0 text-foreground"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="font-medium text-foreground">
                      TV time
                    </span>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                      {(
                        [
                          ["Months", tvBreakdown.months],
                          ["Days", tvBreakdown.days],
                          ["Hours", tvBreakdown.hours],
                        ] as const
                      ).map(([label, value]) => (
                        <div
                          key={label}
                          className="flex flex-col items-center text-center"
                        >
                          <p className="font-heading text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                            {value.toLocaleString()}
                          </p>
                          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-center text-[11px] text-muted-foreground">
                      Estimated from Jikan runtimes (~30-day months).
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-border/80 bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-2 space-y-0 border-b border-border pb-3">
                    <Tv
                      className="size-5 shrink-0 text-foreground"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="font-medium text-foreground">
                      Episodes watched
                    </span>
                  </CardHeader>
                  <CardContent className="flex min-h-[140px] items-center justify-center py-8 sm:min-h-[160px] sm:py-10">
                    <p className="font-heading text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
                      {overviewStats.episodes.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
              {overviewStats.usedDefaultLength > 0 ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {overviewStats.usedDefaultLength} title
                  {overviewStats.usedDefaultLength === 1 ? "" : "s"} use a{" "}
                  {DEFAULT_MINUTES_PER_EPISODE}-minute default per episode
                  (runtime not stored). Use{" "}
                  <span className="font-medium text-primary">
                    Sync from Jikan
                  </span>{" "}
                  on those cards for better accuracy.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing in this list yet. Add anime from Search.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {filtered.map((e) => {
            const genres = parseGenres(e.genresJson);
            const hasType = Boolean(e.mediaType?.trim());
            const displayTitle =
              e.titleEn || e.titleDefault || `Anime #${e.malId}`;
            const isAiring = e.airStatus === "Currently Airing";
            const detailHref = `/anime/${e.malId}`;
            const pct = progressBarPercent(e.watchedEpisodes, e.totalEpisodes);
            const showSyncCta =
              (!hasType && genres.length === 0) || e.totalEpisodes == null;

            return (
              <li key={e.id} className="list-none">
                <Card
                  className={cn(
                    "group/poster h-full gap-0 overflow-hidden rounded-xl border-border/60 bg-card p-0 shadow-sm ring-1 ring-border/25",
                    "transition-shadow hover:shadow-md"
                  )}
                >
                  <div className="relative aspect-[2/3] w-full bg-muted">
                    <Link
                      href={detailHref}
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
                    {isAiring ? (
                      <Badge
                        variant="airing"
                        className="pointer-events-none absolute left-1.5 top-1.5 z-10 px-1.5 py-0 text-[8px] leading-tight"
                      >
                        Airing
                      </Badge>
                    ) : null}
                    {showSyncCta ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-xs"
                        disabled={busyId === e.id}
                        className="absolute right-1.5 top-1.5 z-10 size-7 border border-border/60 bg-background/90 shadow-sm backdrop-blur-sm"
                        aria-label="Sync metadata from Jikan"
                        onClick={(ev) => {
                          ev.preventDefault();
                          ev.stopPropagation();
                          void patch(e.id, { refresh_from_jikan: true });
                        }}
                      >
                        <RefreshCw className="size-3.5" strokeWidth={2} />
                      </Button>
                    ) : null}
                  </div>

                  <div
                    className="h-1 w-full bg-muted"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full bg-amber-400 transition-[width] duration-300 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="space-y-2 p-2">
                    <Link
                      href={detailHref}
                      className="line-clamp-2 text-left text-[11px] font-medium leading-snug text-foreground transition-colors hover:text-primary"
                    >
                      {displayTitle}
                    </Link>

                    <div
                      className="flex items-center justify-center gap-0.5"
                      onClick={(ev) => ev.stopPropagation()}
                      onPointerDown={(ev) => ev.stopPropagation()}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        disabled={busyId === e.id || e.watchedEpisodes <= 0}
                        className="size-7 shrink-0 rounded-md"
                        aria-label="Decrease watched episodes"
                        onClick={(ev) => {
                          ev.preventDefault();
                          void patch(e.id, {
                            watched_episodes: e.watchedEpisodes - 1,
                          });
                        }}
                      >
                        −
                      </Button>
                      <div className="min-w-0 flex-1 px-0.5 text-center">
                        <EpisodeWatchedInline
                          watchedEpisodes={e.watchedEpisodes}
                          totalEpisodes={e.totalEpisodes}
                          disabled={busyId === e.id}
                          size="sm"
                          onCommit={(n) =>
                            void patch(e.id, { watched_episodes: n })
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        disabled={
                          busyId === e.id ||
                          (e.totalEpisodes != null &&
                            e.watchedEpisodes >= e.totalEpisodes)
                        }
                        className="size-7 shrink-0 rounded-md"
                        aria-label="Increase watched episodes"
                        onClick={(ev) => {
                          ev.preventDefault();
                          void patch(e.id, {
                            watched_episodes: e.watchedEpisodes + 1,
                          });
                        }}
                      >
                        +
                      </Button>
                    </div>
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
