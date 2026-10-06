"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Clock, Info, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLoginModal } from "@/components/auth";
import { type UniversalMediaDto } from "@/lib/media-types";

interface MovieHeroProps {
  movie: UniversalMediaDto;
  onTrack?: (status: "plan_to_watch" | "completed") => void;
  isCompleted?: boolean;
  isPlanToWatch?: boolean;
}

export function MovieHero({
  movie,
  onTrack,
  isCompleted = false,
  isPlanToWatch = false,
}: MovieHeroProps) {
  const { status: authStatus } = useSession();
  const { openLoginModal } = useLoginModal();

  const handleAction = (status: "plan_to_watch" | "completed") => {
    if (authStatus !== "authenticated") {
      openLoginModal();
      return;
    }
    onTrack?.(status);
  };

  const backdrop = movie.backdropUrl || movie.posterUrl;

  return (
    <section className="relative mb-10 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
      {/* Background with cinematic gradient */}
      <div className="absolute inset-0 z-0">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            className="object-cover object-center opacity-35 filter brightness-75 scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-10 lg:flex-row lg:items-end lg:justify-between lg:p-12">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-300 border border-cyan-500/30">
              FEATURED MOVIE
            </span>
            {movie.ratingAverage != null && movie.ratingAverage > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30">
                <Star className="h-3 w-3 fill-amber-300" />
                {movie.ratingAverage.toFixed(1)} / 10
              </span>
            )}
            {movie.runtimeMinutes && (
              <span className="text-xs text-zinc-400">
                {movie.runtimeMinutes} min
              </span>
            )}
            {movie.releaseYear && (
              <span className="text-xs text-zinc-400">• {movie.releaseYear}</span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl lg:leading-tight">
            {movie.title}
          </h1>

          {movie.overview && (
            <p className="line-clamp-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
              {movie.overview}
            </p>
          )}

          {movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {movie.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 lg:pt-0">
          <Link
            href={`/movies/${movie.externalId}`}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg transition hover:bg-zinc-200"
          >
            <Info className="h-4 w-4" />
            <span>Details</span>
          </Link>

          <button
            type="button"
            onClick={() => handleAction("plan_to_watch")}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              isPlanToWatch
                ? "border-orange-500 bg-orange-500/20 text-orange-300"
                : "border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-white/10"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{isPlanToWatch ? "In Watchlist" : "Plan to Watch"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("completed")}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
              isCompleted
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                : "border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-white/10"
            }`}
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            <span>{isCompleted ? "Watched" : "Mark Watched"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
