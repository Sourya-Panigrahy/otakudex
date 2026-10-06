import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Clock, Film, Star } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/db";
import { mediaEntries } from "@/db/schema";
import { MovieDetailActions } from "@/components/movies";
import { getMovieDetails } from "@/lib/tmdb";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovieDetails(id);
  if (!movie) {
    return { title: "Movie Not Found" };
  }
  return {
    title: movie.title,
    description: movie.overview || `Track ${movie.title} on Otaku Dex`,
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params;
  const movie = await getMovieDetails(id);

  if (!movie) {
    notFound();
  }

  const session = await auth();
  let initialEntry = null;

  if (session?.user?.id) {
    const [row] = await db
      .select()
      .from(mediaEntries)
      .where(
        and(
          eq(mediaEntries.userId, session.user.id),
          eq(mediaEntries.provider, movie.provider),
          eq(mediaEntries.externalId, String(movie.externalId)),
          eq(mediaEntries.mediaType, "movie")
        )
      )
      .limit(1);

    if (row) {
      initialEntry = {
        id: row.id,
        status: row.status,
        progress: row.progress,
        rating: row.rating,
      };
    }
  }

  const backdrop = movie.backdropUrl || movie.posterUrl;

  return (
    <div className="space-y-8 pb-16">
      {/* Back to Movies Navigation */}
      <div>
        <Link
          href="/movies"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Movies</span>
        </Link>
      </div>

      {/* Hero Backdrop Banner */}
      <div className="relative min-h-[380px] overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 sm:min-h-[460px]">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            className="object-cover opacity-35 filter brightness-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent" />

        <div className="relative z-10 flex flex-col gap-8 p-6 sm:p-10 md:flex-row md:items-end">
          {/* Poster image */}
          <div className="relative aspect-2/3 w-40 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-zinc-900 shadow-2xl sm:w-56 md:w-64">
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 639px) 160px, 256px"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-500">
                <Film className="h-10 w-10" />
                <span className="text-xs">No Poster</span>
              </div>
            )}
          </div>

          {/* Title and metadata */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300 border border-cyan-500/30">
                MOVIE
              </span>
              {movie.ratingAverage != null && movie.ratingAverage > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30">
                  <Star className="h-3.5 w-3.5 fill-amber-300" />
                  {movie.ratingAverage.toFixed(1)} / 10
                  {movie.voteCount ? (
                    <span className="text-[11px] font-normal text-amber-400/80">
                      ({movie.voteCount.toLocaleString()} votes)
                    </span>
                  ) : null}
                </span>
              )}
              {movie.runtimeMinutes && (
                <span className="flex items-center gap-1 text-xs text-zinc-300">
                  <Clock className="h-3 w-3 text-zinc-400" />
                  {movie.runtimeMinutes} min
                </span>
              )}
              {movie.releaseYear && (
                <span className="text-xs text-zinc-400">• {movie.releaseYear}</span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {movie.title}
            </h1>

            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-sm font-medium text-zinc-400">
                {movie.originalTitle}
              </p>
            )}

            {movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {movie.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Overview & Tracking Panel */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Synopsis and details */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white mb-3">Overview</h2>
            <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
              {movie.overview || "No overview available for this title."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
              <span className="text-xs text-zinc-500">Release Date</span>
              <p className="mt-1 text-sm font-semibold text-white">
                {movie.releaseDate || "Unknown"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
              <span className="text-xs text-zinc-500">Status</span>
              <p className="mt-1 text-sm font-semibold text-white">
                {movie.airStatus || "Released"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
              <span className="text-xs text-zinc-500">Runtime</span>
              <p className="mt-1 text-sm font-semibold text-white">
                {movie.runtimeMinutes ? `${movie.runtimeMinutes} minutes` : "Unknown"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Tracking Actions Bar */}
        <div>
          <MovieDetailActions movie={movie} initialEntry={initialEntry} />
        </div>
      </div>
    </div>
  );
}
