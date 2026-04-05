"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";

import { EpisodeWatchedInline } from "@/components/episode-watched-inline";
import {
  ENTRY_STATUS_LABEL,
  type EntryStatus,
} from "@/lib/entry-status";
import { isCurrentlyAiring } from "@/lib/list-entry-rules";

const STATUS_ORDER: EntryStatus[] = [
  "plan_to_watch",
  "watching",
  "completed",
];

type EntryDto = {
  id: string;
  malId: number;
  status: string;
  watchedEpisodes: number;
  totalEpisodes: number | null;
  airStatus: string | null;
};

type Props = {
  malId: number;
  initialEntry: {
    id: string;
    status: string;
    watchedEpisodes: number;
    totalEpisodes: number | null;
    airStatus: string | null;
  } | null;
  jikanEpisodeCount: number | null;
  jikanBroadcastStatus: string | null;
};

export function AnimeDetailActions({
  malId,
  initialEntry,
  jikanEpisodeCount,
  jikanBroadcastStatus,
}: Props) {
  const { data: session, status } = useSession();
  const [existing, setExisting] = useState<EntryDto | null>(
    initialEntry
      ? {
          id: initialEntry.id,
          malId,
          status: initialEntry.status,
          watchedEpisodes: initialEntry.watchedEpisodes,
          totalEpisodes: initialEntry.totalEpisodes,
          airStatus: initialEntry.airStatus,
        }
      : null
  );
  const [pending, setPending] = useState(false);
  const [busyPatch, setBusyPatch] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    if (!session?.user?.id) {
      setExisting(null);
      return;
    }
    const res = await fetch("/api/entries");
    if (!res.ok) return;
    const json = (await res.json()) as { entries: EntryDto[] };
    const row = json.entries.find((e) => e.malId === malId);
    setExisting(
      row
        ? {
            id: row.id,
            malId: row.malId,
            status: row.status,
            watchedEpisodes: row.watchedEpisodes,
            totalEpisodes: row.totalEpisodes,
            airStatus: row.airStatus ?? null,
          }
        : null
    );
  }, [session?.user?.id, malId]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const signedIn = status === "authenticated";

  const effectiveTotal = useMemo(() => {
    if (!existing) return null;
    return existing.totalEpisodes ?? jikanEpisodeCount ?? null;
  }, [existing, jikanEpisodeCount]);

  const airingForList = useMemo(() => {
    return isCurrentlyAiring(
      existing?.airStatus ?? jikanBroadcastStatus ?? null
    );
  }, [existing?.airStatus, jikanBroadcastStatus]);

  const add = async (statusChoice: EntryStatus) => {
    if (!signedIn) {
      void signIn("github");
      return;
    }
    setFormError(null);
    setPending(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mal_id: malId, status: statusChoice }),
      });
      const json = (await res.json()) as {
        entry?: EntryDto;
        error?: string;
      };
      if (res.status === 409 && json.entry) {
        setExisting({
          id: json.entry.id,
          malId,
          status: json.entry.status,
          watchedEpisodes: json.entry.watchedEpisodes,
          totalEpisodes: json.entry.totalEpisodes,
          airStatus: json.entry.airStatus ?? null,
        });
        return;
      }
      if (!res.ok) {
        setFormError(json.error ?? "Could not add to list.");
        return;
      }
      if (json.entry) {
        setExisting({
          id: json.entry.id,
          malId,
          status: json.entry.status,
          watchedEpisodes: json.entry.watchedEpisodes,
          totalEpisodes: json.entry.totalEpisodes,
          airStatus: json.entry.airStatus ?? null,
        });
      }
    } finally {
      setPending(false);
    }
  };

  const patch = async (body: Record<string, unknown>) => {
    if (!existing) return;
    setPatchError(null);
    setBusyPatch(true);
    try {
      const res = await fetch(`/api/entries/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { entry?: EntryDto; error?: string };
      if (!res.ok) {
        setPatchError(json.error ?? "Could not update.");
        return;
      }
      if (json.entry) {
        setExisting({
          id: json.entry.id,
          malId,
          status: json.entry.status,
          watchedEpisodes: json.entry.watchedEpisodes,
          totalEpisodes: json.entry.totalEpisodes,
          airStatus: json.entry.airStatus ?? null,
        });
      }
    } finally {
      setBusyPatch(false);
    }
  };

  const epBadge =
    jikanEpisodeCount != null ? String(jikanEpisodeCount) : "—";

  const addCompletedDisabled =
    pending || isCurrentlyAiring(jikanBroadcastStatus);

  if (existing) {
    const statusSelectLocked =
      airingForList && existing.status !== "completed";

    return (
      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
          My list
        </h2>
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Progress
          </p>
          <div className="mt-1.5">
            <EpisodeWatchedInline
              watchedEpisodes={existing.watchedEpisodes}
              totalEpisodes={effectiveTotal}
              disabled={busyPatch}
              onCommit={(n) => void patch({ watched_episodes: n })}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Click the count to type a value. Use + / − below for single steps.
          </p>
        </div>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          List status
        </label>
        <select
          className="mt-2 w-full cursor-pointer rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm font-medium text-zinc-100 outline-none transition focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
          value={existing.status}
          disabled={busyPatch}
          onChange={(ev) => {
            const next = ev.target.value as EntryStatus;
            void patch({ status: next });
          }}
        >
          {STATUS_ORDER.map((s) => (
            <option
              key={s}
              value={s}
              disabled={
                s === "completed" && statusSelectLocked
              }
            >
              {ENTRY_STATUS_LABEL[s]}
              {s === "completed" && airingForList ? " (not finished)" : ""}
            </option>
          ))}
        </select>
        {airingForList ? (
          <p className="mt-1 text-xs text-zinc-500">
            Still airing: use Watching until the series ends. Watched unlocks
            when Jikan no longer lists it as &quot;Currently Airing&quot; (sync
            to refresh).
          </p>
        ) : null}

        {patchError ? (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-300">
            {patchError}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busyPatch || existing.watchedEpisodes <= 0}
            className="rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-40"
            onClick={() =>
              void patch({ watched_episodes: existing.watchedEpisodes - 1 })
            }
          >
            −
          </button>
          <button
            type="button"
            disabled={
              busyPatch ||
              (effectiveTotal != null &&
                existing.watchedEpisodes >= effectiveTotal)
            }
            className="rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-40"
            onClick={() =>
              void patch({ watched_episodes: existing.watchedEpisodes + 1 })
            }
          >
            +
          </button>
          <button
            type="button"
            disabled={busyPatch}
            className="ml-1 text-xs text-cyan-400/90 underline-offset-2 hover:underline"
            onClick={() => void patch({ refresh_from_jikan: true })}
          >
            Sync total from Jikan
          </button>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          When you reach the last episode of a finished show, status moves to
          Watched automatically.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
        My list
      </h2>
      {formError ? (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {formError}
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
          onClick={() => void add("plan_to_watch")}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add to Plan to Watch
        </button>
        <button
          type="button"
          disabled={pending}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-800/90 px-4 py-3 text-left text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-50"
          onClick={() => void add("watching")}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-400" aria-hidden />
            Add to Watching
          </span>
          <span className="tabular-nums text-zinc-500">{epBadge}</span>
        </button>
        <button
          type="button"
          disabled={pending || addCompletedDisabled}
          title={
            addCompletedDisabled
              ? "Still-airing shows cannot be added as Watched"
              : undefined
          }
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-800/90 px-4 py-3 text-left text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-50"
          onClick={() => void add("completed")}
        >
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" aria-hidden />
            Mark as Watched
          </span>
          <ChevronDown className="h-4 w-4 text-zinc-500" aria-hidden />
        </button>
        {addCompletedDisabled ? (
          <p className="text-xs text-zinc-500">
            This title is still airing — add it as Watching or Plan to Watch
            instead.
          </p>
        ) : null}
      </div>
    </section>
  );
}
