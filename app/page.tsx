import { AnimeSearch } from "@/components/anime-search";
import type { AnimeListDto } from "@/lib/jikan";
import { getSeasonsNow, getSeasonsUpcoming } from "@/lib/jikan";

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

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
          Anime tracker
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:mt-2 dark:text-zinc-400">
          This season, upcoming, and search via Jikan (MyAnimeList). Sign in to
          save titles to your list.
        </p>
      </div>
      <AnimeSearch discover={discover} />
    </>
  );
}
