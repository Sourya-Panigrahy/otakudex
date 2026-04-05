import { Suspense } from "react";

import { AnimeSearch } from "@/components/anime-search";
import { ContinueTracking } from "@/components/continue-tracking";
import { HomeHero } from "@/components/home-hero";
import type { AnimeListDto } from "@/lib/jikan";
import { getSeasonsNow, getSeasonsUpcoming } from "@/lib/jikan";

function SearchSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 animate-pulse rounded-xl bg-zinc-900/80" />
      <div className="h-48 animate-pulse rounded-xl bg-zinc-900/50" />
    </div>
  );
}

export default async function HomePage() {
  let discover: { now: AnimeListDto[]; upcoming: AnimeListDto[] } = {
    now: [],
    upcoming: [],
  };

  const [nowRes, upcomingRes] = await Promise.allSettled([
    getSeasonsNow(12),
    getSeasonsUpcoming(12),
  ]);

  if (nowRes.status === "fulfilled") {
    discover = { ...discover, now: nowRes.value };
  }
  if (upcomingRes.status === "fulfilled") {
    discover = { ...discover, upcoming: upcomingRes.value };
  }

  const featured = discover.now[0];

  return (
    <>
      <HomeHero featured={featured} />
      <ContinueTracking />
      <Suspense fallback={<SearchSkeleton />}>
        <AnimeSearch discover={discover} />
      </Suspense>
    </>
  );
}
