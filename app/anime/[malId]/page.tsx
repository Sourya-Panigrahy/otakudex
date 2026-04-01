import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { AnimeDetailActions } from "@/components/anime-detail-actions";
import { db } from "@/db";
import { animeEntries } from "@/db/schema";
import { getAnimeByMalId } from "@/lib/jikan";

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
    title: `${title} · Anime tracker`,
    description: anime?.synopsis?.slice(0, 160) ?? undefined,
  };
}

export default async function AnimeDetailPage(props: PageProps) {
  const { malId: raw } = await props.params;
  const malId = Number.parseInt(raw, 10);
  if (!Number.isFinite(malId) || malId <= 0) {
    notFound();
  }

  const anime = await getAnimeByMalId(malId);
  if (!anime) {
    notFound();
  }

  const session = await auth();
  let initialEntry: {
    id: string;
    status: string;
    watchedEpisodes: number;
    totalEpisodes: number | null;
  } | null = null;
  if (session?.user?.id) {
    const rows = await db
      .select({
        id: animeEntries.id,
        status: animeEntries.status,
        watchedEpisodes: animeEntries.watchedEpisodes,
        totalEpisodes: animeEntries.totalEpisodes,
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

  return (
    <div className="w-full max-w-4xl">
      <p className="mb-4 text-sm sm:mb-6">
        <Link
          href="/"
          className="text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Search
        </Link>
      </p>

      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        <div className="relative mx-auto aspect-2/3 w-full max-w-[220px] shrink-0 overflow-hidden rounded-xl bg-zinc-100 shadow-md dark:bg-zinc-800 sm:mx-0">
          {anime.image_url ? (
            <Image
              src={anime.image_url}
              alt=""
              fill
              className="object-cover"
              sizes="220px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {displayTitle}
            </h1>
            {subTitle ? (
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {subTitle}
              </p>
            ) : null}
          </div>

          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {anime.status ? (
              <>
                <dt className="text-zinc-500 dark:text-zinc-400">Status</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {anime.status}
                </dd>
              </>
            ) : null}
            {anime.episodes != null ? (
              <>
                <dt className="text-zinc-500 dark:text-zinc-400">Episodes</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {anime.episodes}
                </dd>
              </>
            ) : null}
            {anime.aired ? (
              <>
                <dt className="text-zinc-500 dark:text-zinc-400">Aired</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">{anime.aired}</dd>
              </>
            ) : null}
            {anime.duration ? (
              <>
                <dt className="text-zinc-500 dark:text-zinc-400">Duration</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {anime.duration}
                </dd>
              </>
            ) : null}
            {anime.rating ? (
              <>
                <dt className="text-zinc-500 dark:text-zinc-400">Rating</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {anime.rating}
                  {anime.score != null ? ` · ${anime.score}` : ""}
                </dd>
              </>
            ) : anime.score != null ? (
              <>
                <dt className="text-zinc-500 dark:text-zinc-400">Score</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {anime.score}
                </dd>
              </>
            ) : null}
          </dl>

          {anime.genres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {anime.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {g}
                </span>
              ))}
            </div>
          ) : null}

          {anime.url ? (
            <p>
              <a
                href={anime.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-zinc-900 underline hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
              >
                View on MyAnimeList
              </a>
            </p>
          ) : null}

          <AnimeDetailActions
            malId={malId}
            initialEntry={initialEntry}
            jikanEpisodeCount={anime.episodes}
          />

          {anime.synopsis ? (
            <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Synopsis
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {anime.synopsis.replace(/<[^>]*>/g, "")}
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
