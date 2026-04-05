"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { MoreVertical, SquarePen, Star } from "lucide-react";

import { EpisodeWatchedInline } from "@/components/episode-watched-inline";
import { DEFAULT_MINUTES_PER_EPISODE } from "@/lib/jikan-duration";
import { type EntryStatus } from "@/lib/entry-status";

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

const STATUS_TABS: EntryStatus[] = ["plan_to_watch", "watching", "completed"];

const TAB_ORDER: LibraryTab[] = [
  "overview",
  "plan_to_watch",
  "watching",
  "completed",
];

/** Tab labels aligned with the library mock (title case). */
const TAB_LABEL: Record<LibraryTab, string> = {
  overview: "Overview",
  plan_to_watch: "Plan to Watch",
  watching: "Watching",
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

export function LibraryView() {
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
          Sign in with GitHub to view and manage your anime list.
        </p>
        <button
          type="button"
          className="mt-4 rounded-xl border border-sky-500/50 bg-sky-500/10 px-5 py-2.5 text-sm font-medium text-sky-300 transition hover:bg-sky-500/20"
          onClick={() => signIn("github")}
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

  const tabButtonClass = (active: boolean) =>
    [
      "rounded-xl px-4 py-2 text-sm font-medium transition",
      active
        ? "border border-sky-500 text-zinc-50 shadow-[0_0_24px_rgba(56,189,248,0.22),0_0_48px_rgba(139,92,246,0.12)]"
        : "border border-transparent text-zinc-500 hover:text-zinc-300",
    ].join(" ");

  const iconBtn =
    "rounded-lg p-2.5 text-zinc-400 transition hover:bg-zinc-800/80 hover:text-zinc-100";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TAB_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={tabButtonClass(tab === t)}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
        <p className="text-sm tabular-nums text-zinc-500">
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
          {entries.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Add anime from Search to see watch time totals here.
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/80 p-6 ring-1 ring-zinc-700/40">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Episodes watched
              </p>
              <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-zinc-50 sm:text-5xl">
                {overviewStats.episodes.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Across every list column (plan, watching, finished).
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/80 p-6 ring-1 ring-zinc-700/40">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Total hours
              </p>
              <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-sky-300 sm:text-5xl">
                {overviewStats.hours.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                  minimumFractionDigits: 0,
                })}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Estimated from Jikan runtimes per title.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/80 p-6 ring-1 ring-zinc-700/40 sm:col-span-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Total days
              </p>
              <p className="mt-3 text-4xl font-bold tabular-nums tracking-tight text-violet-300 sm:text-5xl">
                {overviewStats.days.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 0,
                })}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Continuous viewing equivalent (24h days).
              </p>
            </div>
          </div>
          {overviewStats.usedDefaultLength > 0 ? (
            <p className="text-xs leading-relaxed text-zinc-500">
              {overviewStats.usedDefaultLength} title
              {overviewStats.usedDefaultLength === 1 ? "" : "s"} use a{" "}
              {DEFAULT_MINUTES_PER_EPISODE}-minute default per episode (runtime
              not stored). Use{" "}
              <span className="text-sky-400/90">Sync from Jikan</span> on those
              cards for better accuracy.
            </p>
          ) : null}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nothing in this list yet. Add anime from Search.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
          {filtered.map((e, index) => {
            const genres = parseGenres(e.genresJson);
            const hasType = Boolean(e.mediaType?.trim());
            const leftStatLabel = hasType ? "Type" : "Genre";
            const leftStatValue =
              hasType
                ? e.mediaType
                : genres.length > 0
                  ? genres.slice(0, 4).join(", ")
                  : null;
            const displayTitle =
              e.titleEn || e.titleDefault || `Anime #${e.malId}`;
            const isAiring = e.airStatus === "Currently Airing";
            const detailHref = `/anime/${e.malId}`;
            const pct = progressBarPercent(e.watchedEpisodes, e.totalEpisodes);
            const showSyncCta =
              (!hasType && genres.length === 0) || e.totalEpisodes == null;
            const completedLocked = isAiring;

            return (
              <li
                key={e.id}
                className="flex min-h-[232px] flex-col rounded-2xl border border-zinc-700/90 bg-zinc-900/80 shadow-[0_4px_24px_rgba(0,0,0,0.35)] ring-1 ring-zinc-700/40 sm:flex-row"
              >
                <Link
                  href={detailHref}
                  className="relative aspect-[2/3] w-full shrink-0 overflow-hidden bg-zinc-950 outline-none ring-sky-500/40 focus-visible:z-10 focus-visible:ring-2 sm:aspect-auto sm:h-auto sm:min-h-[232px] sm:w-1/2 sm:max-w-[50%]"
                >
                  {isAiring ? (
                    <span className="absolute left-2 top-2 z-10 rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950 shadow-sm">
                      Airing
                    </span>
                  ) : null}
                  {e.imageUrl ? (
                    <Image
                      src={e.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="flex h-full min-h-[200px] items-center justify-center text-xs text-zinc-600">
                      No image
                    </div>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col px-4 pb-4 pt-4 sm:min-h-[232px] sm:pl-5 sm:pr-4 sm:pt-5">
                  <div className="min-h-0 flex-1 space-y-4">
                    <div>
                      <Link
                        href={detailHref}
                        className="line-clamp-2 text-left text-[17px] font-bold leading-snug tracking-tight text-zinc-50 underline-offset-2 hover:text-white hover:underline"
                      >
                        {displayTitle}
                      </Link>
                      {e.titleEn &&
                      e.titleDefault &&
                      e.titleEn !== e.titleDefault ? (
                        <p className="mt-1.5 line-clamp-2 text-left text-[13px] leading-snug text-zinc-500">
                          {e.titleDefault}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-xl border border-zinc-700/70 bg-zinc-950/50 p-3.5">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="min-h-[2.75rem]">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                            {leftStatLabel}
                          </p>
                          <p className="mt-1.5 text-base font-semibold leading-tight text-zinc-50">
                            {leftStatValue ? (
                              <span className="line-clamp-2 normal-case tracking-normal">
                                {leftStatValue}
                              </span>
                            ) : (
                              <span className="text-zinc-500">—</span>
                            )}
                          </p>
                          {hasType && genres.length > 0 ? (
                            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-500">
                              {genres.slice(0, 5).join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        <div className="min-h-[2.75rem] text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                            Progress
                          </p>
                          <div className="mt-1.5 flex flex-col items-end gap-0.5">
                            <EpisodeWatchedInline
                              watchedEpisodes={e.watchedEpisodes}
                              totalEpisodes={e.totalEpisodes}
                              disabled={busyId === e.id}
                              size="lg"
                              onCommit={(n) =>
                                void patch(e.id, { watched_episodes: n })
                              }
                            />
                            <span className="text-[10px] text-zinc-600">
                              Click count to type
                            </span>
                          </div>
                        </div>
                      </div>
                      {showSyncCta ? (
                        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-2.5 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-[11px] leading-snug text-zinc-500">
                            Genre, type, or episode total is missing. Pull the
                            latest from Jikan.
                          </p>
                          <button
                            type="button"
                            disabled={busyId === e.id}
                            className="shrink-0 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-40"
                            onClick={() =>
                              void patch(e.id, { refresh_from_jikan: true })
                            }
                          >
                            Sync from Jikan
                          </button>
                        </div>
                      ) : null}
                      <div
                        className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800/90"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full max-w-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-500 transition-[width] duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      List status
                    </label>
                    <select
                      className="mt-1.5 w-full cursor-pointer rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-100 outline-none transition focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40 disabled:opacity-50"
                      value={e.status}
                      disabled={busyId === e.id}
                      aria-label="Change list status"
                      onChange={(ev) => {
                        const next = ev.target.value as EntryStatus;
                        void patch(e.id, { status: next });
                      }}
                    >
                      {STATUS_TABS.map((s) => (
                        <option
                          key={s}
                          value={s}
                          disabled={
                            s === "completed" &&
                            completedLocked &&
                            e.status !== "completed"
                          }
                        >
                          {TAB_LABEL[s]}
                          {s === "completed" && completedLocked
                            ? " (airing)"
                            : ""}
                        </option>
                      ))}
                    </select>
                    {completedLocked ? (
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Watched is disabled while the show is still airing.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 flex min-h-[3rem] items-center justify-between gap-3 border-t border-zinc-700/60 pt-4">
                    <div className="flex min-w-0 shrink items-center gap-0.5">
                      <Link
                        href={detailHref}
                        className={iconBtn}
                        aria-label="Edit"
                      >
                        <SquarePen className="h-4 w-4" strokeWidth={2} />
                      </Link>
                      <Link
                        href={detailHref}
                        className={iconBtn}
                        aria-label="Favorite"
                      >
                        <Star
                          className="h-4 w-4 fill-amber-400/25 text-amber-400/90"
                          strokeWidth={2}
                        />
                      </Link>
                      <details className="relative">
                        <summary
                          className={`${iconBtn} flex cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden`}
                        >
                          <MoreVertical
                            className="h-4 w-4"
                            strokeWidth={2}
                            aria-hidden
                          />
                          <span className="sr-only">More</span>
                        </summary>
                        <div className="absolute bottom-full left-0 z-[30] mb-2 min-w-[11rem] overflow-hidden rounded-xl border border-zinc-600 bg-zinc-950 py-1 text-xs shadow-2xl ring-1 ring-black/40">
                          <button
                            type="button"
                            disabled={busyId === e.id}
                            className="block w-full px-3 py-2 text-left font-medium text-sky-400 transition hover:bg-zinc-900 disabled:opacity-40"
                            onClick={(ev) => {
                              void patch(e.id, { refresh_from_jikan: true });
                              ev.currentTarget
                                .closest("details")
                                ?.removeAttribute("open");
                            }}
                          >
                            Sync from Jikan
                          </button>
                        </div>
                      </details>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <div className="flex overflow-hidden rounded-xl border border-zinc-600 bg-zinc-950/90 tabular-nums shadow-inner shadow-black/20">
                        <button
                          type="button"
                          disabled={busyId === e.id || e.watchedEpisodes <= 0}
                          className="flex h-9 w-9 items-center justify-center border-r border-zinc-600 text-lg leading-none text-zinc-200 transition hover:bg-zinc-800/90 disabled:opacity-30"
                          aria-label="Decrease watched episodes"
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
                          className="flex h-9 w-9 items-center justify-center text-lg leading-none text-zinc-200 transition hover:bg-zinc-800/90 disabled:opacity-30"
                          aria-label="Increase watched episodes"
                          onClick={() =>
                            void patch(e.id, {
                              watched_episodes: e.watchedEpisodes + 1,
                            })
                          }
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-zinc-500">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
