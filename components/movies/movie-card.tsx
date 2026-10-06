"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Clock, Eye, Film, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLoginModal } from "@/components/auth";
import {
  MEDIA_STATUS_LABEL,
  type MediaStatus,
  type UniversalMediaDto,
} from "@/lib/media-types";

export interface MovieTrackState {
  id: string;
  externalId: string;
  status: string;
  progress: number;
  rating?: number | null;
}

interface MovieCardProps {
  movie: UniversalMediaDto;
  tracked?: MovieTrackState | null;
  isPending?: boolean;
  onUpdateStatus?: (movie: UniversalMediaDto, status: MediaStatus) => void;
  priority?: boolean;
}

export function MovieCard({
  movie,
  tracked,
  isPending = false,
  onUpdateStatus,
  priority = false,
}: MovieCardProps) {
  const { status: authStatus } = useSession();
  const { openLoginModal } = useLoginModal();

  const handleAction = (status: MediaStatus) => {
    if (authStatus !== "authenticated") {
      openLoginModal();
      return;
    }
    onUpdateStatus?.(movie, status);
  };

  const isWatched = tracked?.status === "completed";
  const isPlanToWatch = tracked?.status === "plan_to_watch";
  const isWatching = tracked?.status === "watching";

  return (
    <li className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60 shadow-lg shadow-black/20 transition-all duration-300 hover:border-cyan-500/40 hover:shadow-cyan-500/10 hover:shadow-xl">
      <Link
        href={`/movies/${movie.externalId}`}
        className="block flex-1 outline-none ring-cyan-400 focus-visible:ring-2"
      >
        <div className="relative aspect-2/3 w-full overflow-hidden bg-zinc-800">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 16vw"
              priority={priority}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-500">
              <Film className="h-8 w-8" />
              <span className="text-xs">No poster</span>
            </div>
          )}

          {/* Top badges */}
          <div className="absolute left-2 right-2 top-2 flex items-center justify-between gap-1 pointer-events-none">
            {movie.ratingAverage != null && movie.ratingAverage > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-amber-400 backdrop-blur-md shadow">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {movie.ratingAverage.toFixed(1)}
              </span>
            )}
            {movie.runtimeMinutes != null && movie.runtimeMinutes > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-zinc-300 backdrop-blur-md shadow">
                <Clock className="h-3 w-3 text-zinc-400" />
                {movie.runtimeMinutes}m
              </span>
            )}
          </div>

          {/* Quick status indicator pill */}
          {tracked && (
            <div className="absolute bottom-2 left-2 right-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium backdrop-blur-md shadow ${
                  isWatched
                    ? "bg-emerald-500/90 text-white"
                    : isWatching
                    ? "bg-cyan-500/90 text-white"
                    : "bg-orange-500/90 text-white"
                }`}
              >
                {isWatched ? (
                  <Check className="h-3 w-3 stroke-[2.5]" />
                ) : isWatching ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                {MEDIA_STATUS_LABEL[tracked.status as MediaStatus] ?? tracked.status}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 p-2.5 sm:p-3">
          <p className="line-clamp-2 text-left text-sm font-semibold leading-snug text-zinc-50 group-hover:text-cyan-400 sm:text-base">
            {movie.title}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 sm:text-xs">
            <span>{movie.releaseYear ?? "Movie"}</span>
            {movie.genres.length > 0 && (
              <span className="line-clamp-1 max-w-[120px] text-right text-zinc-500">
                {movie.genres.slice(0, 2).join(", ")}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Quick Action Tracking Bar */}
      <div className="border-t border-white/5 bg-zinc-950/40 p-2 sm:p-2.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleAction(isPlanToWatch ? "on_hold" : "plan_to_watch")}
            className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
              isPlanToWatch
                ? "border-orange-500/50 bg-orange-500/20 text-orange-300"
                : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
            } disabled:opacity-50`}
          >
            <Clock className="h-3 w-3" />
            <span>{isPlanToWatch ? "Saved" : "Plan"}</span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleAction(isWatched ? "watching" : "completed")}
            className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
              isWatched
                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
            } disabled:opacity-50`}
          >
            <Check className="h-3 w-3 stroke-[2.5]" />
            <span>{isWatched ? "Watched" : "Mark seen"}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
