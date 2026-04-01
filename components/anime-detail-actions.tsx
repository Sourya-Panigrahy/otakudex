"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";

import {
  ENTRY_STATUS_LABEL,
  type EntryStatus,
} from "@/lib/entry-status";

type EntryDto = {
  id: string;
  malId: number;
  status: string;
  watchedEpisodes: number;
  totalEpisodes: number | null;
};

type Props = {
  malId: number;
  initialEntry: {
    id: string;
    status: string;
    watchedEpisodes: number;
    totalEpisodes: number | null;
  } | null;
  /** From Jikan when DB has no total snapshot yet */
  jikanEpisodeCount: number | null;
};

export function AnimeDetailActions({
  malId,
  initialEntry,
  jikanEpisodeCount,
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
        }
      : null
  );
  const [pending, setPending] = useState(false);
  const [busyPatch, setBusyPatch] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!session?.user?.id) {
      setExisting(null);
      return;
    }
    const res = await fetch("/api/entries");
    if (!res.ok) return;
    const json = (await res.json()) as { entries: EntryDto[] };
    const row = json.entries.find((e) => e.malId === malId);
    setExisting(row ?? null);
  }, [session?.user?.id, malId]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const signedIn = status === "authenticated";

  const effectiveTotal = useMemo(() => {
    if (!existing) return null;
    return existing.totalEpisodes ?? jikanEpisodeCount ?? null;
  }, [existing, jikanEpisodeCount]);

  const progressLabel = useMemo(() => {
    if (!existing) return null;
    const w = existing.watchedEpisodes;
    const t = effectiveTotal;
    if (t != null) {
      return `${w} out of ${t} episodes watched`;
    }
    return `${w} episodes watched (total not set — use “Sync episode total from Jikan”)`;
  }, [existing, effectiveTotal]);

  const add = async (statusChoice: EntryStatus) => {
    if (!signedIn) {
      void signIn("github");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mal_id: malId, status: statusChoice }),
      });
      const json = (await res.json()) as {
        entry?: EntryDto;
      };
      if (res.status === 409 && json.entry) {
        setExisting(json.entry);
        return;
      }
      if (!res.ok) return;
      if (json.entry) {
        setExisting(json.entry);
      }
    } finally {
      setPending(false);
    }
  };

  const patch = async (body: Record<string, unknown>) => {
    if (!existing) return;
    setBusyPatch(true);
    try {
      const res = await fetch(`/api/entries/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { entry: EntryDto };
      setExisting(json.entry);
    } finally {
      setBusyPatch(false);
    }
  };

  if (existing) {
    return (
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            On your list:{" "}
            <span className="font-medium">
              {ENTRY_STATUS_LABEL[
                existing.status as keyof typeof ENTRY_STATUS_LABEL
              ] ?? existing.status}
            </span>
          </p>
          {progressLabel ? (
            <p className="mt-2 text-base font-medium text-zinc-900 dark:text-zinc-50">
              {progressLabel}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <span className="sr-only">Adjust episode count</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={busyPatch || existing.watchedEpisodes <= 0}
              className="rounded border border-zinc-300 px-2.5 py-1 text-sm disabled:opacity-40 dark:border-zinc-600"
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
              className="rounded border border-zinc-300 px-2.5 py-1 text-sm disabled:opacity-40 dark:border-zinc-600"
              onClick={() =>
                void patch({ watched_episodes: existing.watchedEpisodes + 1 })
              }
            >
              +
            </button>
            <button
              type="button"
              disabled={busyPatch}
              className="ml-1 text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
              onClick={() => void patch({ refresh_from_jikan: true })}
            >
              Sync episode total from Jikan
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-500">
          Change list status from{" "}
          <a className="underline" href="/library">
            My list
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(["plan_to_watch", "watching", "completed"] as const).map((s) => (
        <button
          key={s}
          type="button"
          disabled={pending}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          onClick={() => void add(s)}
        >
          {ENTRY_STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  );
}
