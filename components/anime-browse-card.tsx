"use client";

import Image from "next/image";
import Link from "next/link";

import type { AnimeListDto } from "@/lib/jikan";
import {
  ENTRY_STATUS_LABEL,
  type EntryStatus,
} from "@/lib/entry-status";

export type ListEntryRow = {
  id: string;
  malId: number;
  status: string;
};

export type AnimeBrowseCardProps = {
  anime: AnimeListDto;
  priority?: boolean;
  existing?: ListEntryRow | null;
  /** True while this title’s list action is in flight. */
  isPending: boolean;
  onAdd: (malId: number, status: EntryStatus) => void;
};

export function AnimeBrowseCard({
  anime: a,
  priority = false,
  existing,
  isPending,
  onAdd,
}: AnimeBrowseCardProps) {
  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 shadow-lg shadow-black/20">
      <Link
        href={`/anime/${a.mal_id}`}
        className="block flex-1 outline-none ring-zinc-400 focus-visible:ring-2"
      >
        <div className="relative aspect-2/3 w-full bg-zinc-800">
          {a.image_url ? (
            <Image
              src={a.image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 399px) 100vw, (max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 16vw"
              priority={priority}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5 p-2.5 sm:p-3">
          <p className="line-clamp-2 text-left text-sm font-medium leading-snug text-zinc-50 sm:text-base">
            {a.title_english || a.title}
          </p>
          {a.episodes != null ? (
            <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
              {a.episodes} eps
            </p>
          ) : null}
        </div>
      </Link>
      <div className="hidden flex-col gap-2 px-2.5 pb-2.5 sm:flex sm:gap-3 sm:px-3 sm:pb-3">
        {existing ? (
          <p className="text-xs text-zinc-400 sm:text-sm">
            On your list:{" "}
            <span className="font-medium">
              {ENTRY_STATUS_LABEL[
                existing.status as keyof typeof ENTRY_STATUS_LABEL
              ] ?? existing.status}
            </span>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {(
              [
                "plan_to_watch",
                "watching",
                "on_hold",
                "completed",
              ] as const
            ).map((s) => (
              <button
                key={s}
                type="button"
                disabled={isPending}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-medium text-zinc-200 transition hover:bg-white/10 disabled:opacity-50 sm:px-2.5 sm:text-xs"
                onClick={() => void onAdd(a.mal_id, s)}
              >
                {ENTRY_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
