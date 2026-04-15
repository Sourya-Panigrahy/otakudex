import { and, desc, eq, inArray } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db";
import { animeEntries } from "@/db/schema";

const BAR_COLORS = [
  "bg-cyan-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-emerald-500",
] as const;

export async function ContinueTracking() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await db
    .select()
    .from(animeEntries)
    .where(
      and(
        eq(animeEntries.userId, session.user.id),
        inArray(animeEntries.status, ["watching", "on_hold"])
      )
    )
    .orderBy(desc(animeEntries.updatedAt))
    .limit(8);

  if (rows.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
            In progress
          </h2>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
            Keep your active and paused shows moving.
          </p>
        </div>
        <Link
          href="/library"
          className="shrink-0 text-xs font-medium text-cyan-400 hover:text-cyan-300 sm:text-sm"
        >
          View all
        </Link>
      </div>
      <ul className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((entry, i) => {
          const title = entry.titleEn || entry.titleDefault || `Anime ${entry.malId}`;
          const total = entry.totalEpisodes;
          const watched = entry.watchedEpisodes;
          const pct =
            total != null && total > 0
              ? Math.min(100, Math.round((watched / total) * 100))
              : 0;
          const barClass = BAR_COLORS[i % BAR_COLORS.length];

          return (
            <li
              key={entry.id}
              className="w-[min(100%,240px)] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 shadow-lg shadow-black/20"
            >
              <Link
                href={`/anime/${entry.malId}`}
                className="flex gap-3 p-3 outline-none ring-cyan-500/50 focus-visible:ring-2"
              >
                <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                  {entry.imageUrl ? (
                    <Image
                      src={entry.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                      priority={i === 0}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-zinc-100">
                    {title}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {total != null
                      ? `Episode ${watched} of ${total}`
                      : `${watched} eps watched`}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full transition-all ${barClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
              <div className="border-t border-white/5 px-3 py-2">
                <Link
                  href="/library"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Update
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
