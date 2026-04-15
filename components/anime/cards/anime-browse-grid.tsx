"use client";

import { useCallback, useEffect, useState } from "react";
import { useLoginModal } from "@/components/auth";
import { useSession } from "next-auth/react";

import {
  AnimeBrowseCard,
  type ListEntryRow,
} from "@/components/anime/cards/anime-browse-card";
import type { AnimeListDto } from "@/lib/jikan";
import type { EntryStatus } from "@/lib/entry-status";

export const ANIME_BROWSE_GRID_CLASS =
  "grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

type AnimeBrowseGridProps = {
  items: AnimeListDto[];
  /** Prefix for React keys (e.g. "now", "up"). */
  listKey: string;
  priorityCount?: number;
};

/** Self-contained grid with list-entry state — use on discover pages. */
export function AnimeBrowseGrid({
  items,
  listKey,
  priorityCount = 6,
}: AnimeBrowseGridProps) {
  const { openLoginModal } = useLoginModal();
  const { data: session, status } = useSession();
  const [byMalId, setByMalId] = useState<Map<number, ListEntryRow>>(
    new Map()
  );
  const [pendingMal, setPendingMal] = useState<number | null>(null);

  const loadEntries = useCallback(async () => {
    if (!session?.user?.id) {
      setByMalId(new Map());
      return;
    }
    const res = await fetch("/api/entries");
    if (!res.ok) return;
    const json = (await res.json()) as {
      entries: Array<{ id: string; malId: number; status: string }>;
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

  return (
    <ul className={ANIME_BROWSE_GRID_CLASS}>
      {items.map((a, index) => (
        <AnimeBrowseCard
          key={`${listKey}-${a.mal_id}`}
          anime={a}
          priority={index < priorityCount}
          existing={byMalId.get(a.mal_id)}
          isPending={pendingMal === a.mal_id}
          onAdd={add}
        />
      ))}
    </ul>
  );
}
