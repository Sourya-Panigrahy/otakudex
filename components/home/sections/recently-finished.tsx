import { and, desc, eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db";
import { animeEntries } from "@/db/schema";

export async function RecentlyFinished() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await db
    .select()
    .from(animeEntries)
    .where(
      and(
        eq(animeEntries.userId, session.user.id),
        eq(animeEntries.status, "completed")
      )
    )
    .orderBy(desc(animeEntries.updatedAt))
    .limit(10);

  if (rows.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
              Recently finished
            </h2>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              {rows.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
            Shows you&apos;ve marked as completed.
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
          const episodes = entry.totalEpisodes ?? entry.watchedEpisodes;

          return (
            <li
              key={entry.id}
              className="w-[min(100%,220px)] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 shadow-lg shadow-black/20 transition hover:border-emerald-500/30"
            >
              <Link
                href={`/anime/${entry.malId}`}
                className="flex gap-3 p-3 outline-none ring-emerald-500/50 focus-visible:ring-2"
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
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="font-medium">Completed</span>
                  </div>
                  {episodes ? (
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {episodes} {episodes === 1 ? "episode" : "episodes"}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
