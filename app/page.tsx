import { Suspense } from "react";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { AnimeSearch } from "@/components/anime";
import { ContinueTracking, HomeHero } from "@/components/home";
import { db } from "@/db";
import { animeEntries } from "@/db/schema";
import type { AnimeListDto } from "@/lib/jikan";
import { getSeasonsNow, getSeasonsUpcomingVaried } from "@/lib/jikan";

function SearchSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 animate-pulse rounded-xl bg-zinc-900/80" />
      <div className="h-48 animate-pulse rounded-xl bg-zinc-900/50" />
    </div>
  );
}

export default async function HomePage() {
  const session = await auth();
  const dayKey = new Date().toISOString().slice(0, 10);
  const upcomingSeed = `${session?.user?.id ?? "guest"}:${dayKey}`;

  let discover: { now: AnimeListDto[]; upcoming: AnimeListDto[] } = {
    now: [],
    upcoming: [],
  };
  let heroPool: AnimeListDto[] = [];

  const [nowRes, upcomingRes] = await Promise.allSettled([
    getSeasonsNow(12),
    getSeasonsUpcomingVaried({ limit: 12, seed: upcomingSeed }),
  ]);

  if (nowRes.status === "fulfilled") {
    discover = { ...discover, now: nowRes.value };
    heroPool = nowRes.value;
  }
  if (upcomingRes.status === "fulfilled") {
    discover = { ...discover, upcoming: upcomingRes.value };
    heroPool =
      heroPool.length === 0
        ? upcomingRes.value
        : [...heroPool, ...upcomingRes.value].filter(
            (a, i, arr) => arr.findIndex((x) => x.mal_id === a.mal_id) === i
          );
  }

  if (session?.user?.id) {
    const rows = await db
      .select({ malId: animeEntries.malId })
      .from(animeEntries)
      .where(eq(animeEntries.userId, session.user.id));
    const inList = new Set(rows.map((r) => r.malId));
    discover = {
      now: discover.now.filter((a) => !inList.has(a.mal_id)),
      upcoming: discover.upcoming.filter((a) => !inList.has(a.mal_id)),
    };
  }

  const heroItems =
    heroPool.length > 0 ? heroPool.slice(0, 6) : [...discover.now, ...discover.upcoming].slice(0, 6);

  return (
    <>
      <HomeHero featuredItems={heroItems} />
      <ContinueTracking />
      <Suspense fallback={<SearchSkeleton />}>
        <AnimeSearch discover={discover} />
      </Suspense>
    </>
  );
}
