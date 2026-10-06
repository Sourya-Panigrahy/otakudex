"use client";

import { useState } from "react";
import { Check, Clock, Eye, Star, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useLoginModal } from "@/components/auth";
import {
  MEDIA_STATUS_LABEL,
  type MediaStatus,
  type UniversalMediaDto,
} from "@/lib/media-types";

interface MovieDetailActionsProps {
  movie: UniversalMediaDto;
  initialEntry?: {
    id: string;
    status: string;
    progress: number;
    rating?: number | null;
  } | null;
}

const STATUS_BUTTONS: Array<{ status: MediaStatus; label: string }> = [
  { status: "plan_to_watch", label: "Plan to watch" },
  { status: "watching", label: "Watching" },
  { status: "completed", label: "Watched" },
];

export function MovieDetailActions({
  movie,
  initialEntry,
}: MovieDetailActionsProps) {
  const { status: authStatus } = useSession();
  const { openLoginModal } = useLoginModal();

  const [entry, setEntry] = useState(initialEntry ?? null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number | null>(initialEntry?.rating ?? null);

  const handleStatusChange = async (newStatus: MediaStatus) => {
    if (authStatus !== "authenticated") {
      openLoginModal();
      return;
    }

    setLoading(true);
    try {
      if (entry) {
        const res = await fetch(`/api/media/entries/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            progress: newStatus === "completed" ? 1 : 0,
            rating,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update");
        }

        const data = await res.json();
        setEntry(data.entry);
        toast.success(`Updated status to ${MEDIA_STATUS_LABEL[newStatus]}`);
      } else {
        const res = await fetch("/api/media/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaType: "movie",
            provider: movie.provider,
            externalId: String(movie.externalId),
            status: newStatus,
            title: movie.title,
            titleEn: movie.title,
            posterUrl: movie.posterUrl,
            backdropUrl: movie.backdropUrl,
            overview: movie.overview,
            releaseDate: movie.releaseDate,
            genres: movie.genres,
            airStatus: movie.airStatus,
            runtimeMinutes: movie.runtimeMinutes,
            totalEpisodes: 1,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to track");
        }

        const data = await res.json();
        setEntry(data.entry);
        toast.success(`Added "${movie.title}" to list!`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error saving");
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = async (star: number) => {
    if (authStatus !== "authenticated") {
      openLoginModal();
      return;
    }

    const nextRating = rating === star ? null : star;
    setRating(nextRating);

    if (entry) {
      try {
        await fetch(`/api/media/entries/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: nextRating }),
        });
        toast.success(nextRating ? `Rated ${nextRating}/10` : "Rating removed");
      } catch {
        toast.error("Failed to update rating");
      }
    }
  };

  const handleRemove = async () => {
    if (!entry) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/media/entries/${entry.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
      setEntry(null);
      setRating(null);
      toast.success("Removed from your list");
    } catch {
      toast.error("Could not remove from list");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-xl sm:p-6">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Your Tracking
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          {entry
            ? `Currently: ${MEDIA_STATUS_LABEL[entry.status as MediaStatus] ?? entry.status}`
            : "Not in your list yet"}
        </p>
      </div>

      {/* Status Action Buttons */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {STATUS_BUTTONS.map((btn) => {
          const active = entry?.status === btn.status;
          return (
            <button
              key={btn.status}
              type="button"
              disabled={loading}
              onClick={() => handleStatusChange(btn.status)}
              className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-semibold transition sm:text-sm ${
                active
                  ? btn.status === "completed"
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-md shadow-emerald-500/10"
                    : btn.status === "watching"
                    ? "border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10"
                    : "border-orange-500 bg-orange-500/20 text-orange-300 shadow-md shadow-orange-500/10"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
              } disabled:opacity-50`}
            >
              {btn.status === "completed" ? (
                <Check className="h-4 w-4" />
              ) : btn.status === "watching" ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* 10-Star Rating Selector */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">Your Rating</span>
          <span className="text-xs font-semibold text-amber-400">
            {rating ? `${rating} / 10` : "Not rated"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(star)}
              className={`p-1 transition hover:scale-125 ${
                rating && rating >= star ? "text-amber-400" : "text-zinc-600 hover:text-amber-300"
              }`}
              title={`Rate ${star}/10`}
            >
              <Star
                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  rating && rating >= star ? "fill-amber-400" : ""
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Remove Button if entry exists */}
      {entry && (
        <div className="pt-2 border-t border-white/5 flex justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={handleRemove}
            className="flex items-center gap-1.5 text-xs text-rose-400 transition hover:text-rose-300 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Remove from list</span>
          </button>
        </div>
      )}
    </div>
  );
}
