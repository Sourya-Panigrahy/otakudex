import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { AnimeDetailActions } from "@/components/anime-detail-actions";
import {
  AnimeDetailCharacterScroll,
  AnimeDetailGenreTags,
  AnimeDetailPageFooter,
  AnimeDetailQuickStats,
  AnimeDetailShareCard,
  AnimeDetailSimilarAnime,
  AnimeDetailSynopsis,
  extractSourceFromSynopsis,
} from "@/components/anime-detail";
import { db } from "@/db";
import { animeEntries } from "@/db/schema";
import {
  getAnimeByMalId,
  getAnimeCharacters,
  getAnimeRecommendations,
} from "@/lib/jikan";

type PageProps = { params: Promise<{ malId: string }> };

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { malId: raw } = await props.params;
  const malId = Number.parseInt(raw, 10);
  if (!Number.isFinite(malId)) {
    return { title: "Anime" };
  }
  const anime = await getAnimeByMalId(malId);
  const title = anime?.title_english || anime?.title || `Anime ${malId}`;
  return {
    title: `${title} · Otaku Dex`,
    description: anime?.synopsis?.slice(0, 160) ?? undefined,
  };
}

export default async function AnimeDetailPage(props: PageProps) {
  const { malId: raw } = await props.params;
  const malId = Number.parseInt(raw, 10);
  if (!Number.isFinite(malId) || malId <= 0) {
    notFound();
  }

  const [anime, characters, recommendations] = await Promise.all([
    getAnimeByMalId(malId),
    getAnimeCharacters(malId),
    getAnimeRecommendations(malId),
  ]);

  if (!anime) {
    notFound();
  }

  const session = await auth();
  let initialEntry: {
    id: string;
    status: string;
    watchedEpisodes: number;
    totalEpisodes: number | null;
    airStatus: string | null;
  } | null = null;
  if (session?.user?.id) {
    const rows = await db
      .select({
        id: animeEntries.id,
        status: animeEntries.status,
        watchedEpisodes: animeEntries.watchedEpisodes,
        totalEpisodes: animeEntries.totalEpisodes,
        airStatus: animeEntries.airStatus,
      })
      .from(animeEntries)
      .where(
        and(
          eq(animeEntries.userId, session.user.id),
          eq(animeEntries.malId, malId)
        )
      )
      .limit(1);
    initialEntry = rows[0] ?? null;
  }

  const displayTitle = anime.title_english || anime.title;
  const subTitle =
    anime.title_english && anime.title !== anime.title_english
      ? anime.title
      : null;

  const { body: synopsisBody, source: synopsisSource } =
    extractSourceFromSynopsis(anime.synopsis ?? "");

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const shareUrl =
    host.length > 0
      ? `${proto}://${host}/anime/${malId}`
      : anime.url ?? `https://myanimelist.net/anime/${malId}`;

  return (
    <div className="w-full max-w-6xl pb-8">
      <p className="mb-6 text-sm">
        <Link
          href="/"
          className="text-zinc-500 transition hover:text-cyan-400"
        >
          ← Back
        </Link>
      </p>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
        <div className="relative mx-auto aspect-2/3 w-full max-w-[280px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-800 shadow-xl lg:mx-0 lg:max-w-none">
          {anime.image_url ? (
            <Image
              src={anime.image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 280px, 280px"
              loading="eager"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-3xl lg:text-4xl">
              {displayTitle}
            </h1>
            {subTitle ? (
              <p className="mt-2 text-sm text-zinc-400 sm:text-base">
                {subTitle}
              </p>
            ) : null}
          </div>

          <AnimeDetailQuickStats
            status={anime.status}
            episodes={anime.episodes}
            aired={anime.aired}
            rating={anime.rating}
          />
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_minmax(0,320px)] lg:items-start">
        <div className="order-2 min-w-0 space-y-10 lg:order-none">
          {synopsisBody ? (
            <AnimeDetailSynopsis
              synopsis={synopsisBody}
              sourceNote={synopsisSource}
            />
          ) : null}

          <AnimeDetailGenreTags genres={anime.genres} />

          <AnimeDetailCharacterScroll characters={characters} />
        </div>

        <aside className="order-1 flex min-w-0 flex-col gap-6 lg:sticky lg:top-24 lg:order-none">
          <AnimeDetailActions
            malId={malId}
            initialEntry={initialEntry}
            jikanEpisodeCount={anime.episodes}
            jikanBroadcastStatus={anime.status}
          />
          <AnimeDetailShareCard url={shareUrl} title={displayTitle} />
          <AnimeDetailSimilarAnime items={recommendations} />
        </aside>
      </div>

      {anime.url ? (
        <p className="mt-8 text-center text-sm text-zinc-500">
          <a
            href={anime.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400/90 underline-offset-2 hover:underline"
          >
            View on MyAnimeList
          </a>
        </p>
      ) : null}

      <AnimeDetailPageFooter />
    </div>
  );
}
