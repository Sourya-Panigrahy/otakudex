"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Film, Loader2, Search, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { MovieCard, type MovieTrackState } from "./movie-card";
import { MovieHero } from "./movie-hero";
import { type MediaStatus, type UniversalMediaDto } from "@/lib/media-types";

const GENRES = [
  "All",
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Drama",
  "Fantasy",
  "Science Fiction",
  "Thriller",
];

interface MoviesViewProps {
  initialTrending: UniversalMediaDto[];
  initialPopular: UniversalMediaDto[];
  initialTopRated: UniversalMediaDto[];
}

export function MoviesView({
  initialTrending,
  initialPopular,
  initialTopRated,
}: MoviesViewProps) {
  const { data: session } = useSession();

  const [activeCategory, setActiveCategory] = useState<"trending" | "popular" | "top_rated">("trending");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UniversalMediaDto[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Tracked media entries map: externalId -> MovieTrackState
  const [trackedMap, setTrackedMap] = useState<Map<string, MovieTrackState>>(new Map());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  // Load user's movie tracking entries
  const fetchTrackedEntries = useCallback(async () => {
    if (!session?.user?.id) {
      setTrackedMap(new Map());
      return;
    }

    try {
      const res = await fetch("/api/media/entries?type=movie", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        entries?: Array<{
          id: string;
          externalId: string;
          status: string;
          progress: number;
          rating?: number | null;
        }>;
      };

      const nextMap = new Map<string, MovieTrackState>();
      for (const row of data.entries ?? []) {
        nextMap.set(row.externalId, {
          id: row.id,
          externalId: row.externalId,
          status: row.status,
          progress: row.progress,
          rating: row.rating,
        });
      }
      setTrackedMap(nextMap);
    } catch (err) {
      console.error("Failed to load tracked movies", err);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    void fetchTrackedEntries();
  }, [fetchTrackedEntries]);

  // Handle Search Debounce
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const json = (await res.json()) as { results?: UniversalMediaDto[] };
          setSearchResults(json.results ?? []);
        }
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Status Update / Add to list
  const handleUpdateStatus = async (movie: UniversalMediaDto, newStatus: MediaStatus) => {
    const extId = String(movie.externalId);
    const existing = trackedMap.get(extId);

    setPendingIds((prev) => new Set(prev).add(extId));

    try {
      if (existing) {
        // Update existing entry via PATCH
        const res = await fetch(`/api/media/entries/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            progress: newStatus === "completed" ? 1 : 0,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update status");
        }

        const data = (await res.json()) as {
          entry: { id: string; status: string; progress: number };
        };

        setTrackedMap((prev) => {
          const next = new Map(prev);
          next.set(extId, {
            ...existing,
            status: data.entry.status,
            progress: data.entry.progress,
          });
          return next;
        });

        toast.success(`Updated status to ${newStatus.replace(/_/g, " ")}`);
      } else {
        // Add new entry via POST
        const res = await fetch("/api/media/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaType: "movie",
            provider: movie.provider,
            externalId: extId,
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
          throw new Error(err.error || "Failed to track movie");
        }

        const data = (await res.json()) as {
          entry: { id: string; status: string; progress: number };
        };

        setTrackedMap((prev) => {
          const next = new Map(prev);
          next.set(extId, {
            id: data.entry.id,
            externalId: extId,
            status: data.entry.status,
            progress: data.entry.progress,
          });
          return next;
        });

        toast.success(`Added "${movie.title}" to list!`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(extId);
        return next;
      });
    }
  };

  // Determine movies to display
  const baseMovies = useMemo(() => {
    if (searchResults !== null) {
      return searchResults;
    }
    if (activeCategory === "popular") return initialPopular;
    if (activeCategory === "top_rated") return initialTopRated;
    return initialTrending;
  }, [activeCategory, initialPopular, initialTopRated, initialTrending, searchResults]);

  const displayedMovies = useMemo(() => {
    if (selectedGenre === "All") return baseMovies;
    return baseMovies.filter((m) =>
      m.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
    );
  }, [baseMovies, selectedGenre]);

  const featuredMovie = initialTrending[0] ?? initialPopular[0];
  const featuredExtId = featuredMovie ? String(featuredMovie.externalId) : "";
  const featuredTracked = trackedMap.get(featuredExtId);

  return (
    <div className="flex flex-col gap-8">
      {/* Featured Hero Banner */}
      {!searchQuery && featuredMovie && (
        <MovieHero
          movie={featuredMovie}
          onTrack={(status) => handleUpdateStatus(featuredMovie, status)}
          isCompleted={featuredTracked?.status === "completed"}
          isPlanToWatch={featuredTracked?.status === "plan_to_watch"}
        />
      )}

      {/* Control bar: Categories, Genre Pills & Search */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/60 p-1 backdrop-blur-md">
            {(
              [
                { id: "trending", label: "Trending" },
                { id: "popular", label: "Popular" },
                { id: "top_rated", label: "Top Rated" },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchQuery("");
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  activeCategory === cat.id && !searchQuery
                    ? "bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/25"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[260px] sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900/80 py-2 pl-9 pr-8 text-xs text-white placeholder-zinc-500 backdrop-blur-md transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 sm:text-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-cyan-400" />
            )}
          </div>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => setSelectedGenre(genre)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
                selectedGenre === genre
                  ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Movies */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white sm:text-xl">
            <Film className="h-5 w-5 text-cyan-400" />
            <span>
              {searchQuery
                ? `Search results for "${searchQuery}"`
                : activeCategory === "trending"
                ? "Trending Movies"
                : activeCategory === "popular"
                ? "Popular Movies"
                : "Top Rated Movies"}
            </span>
            {selectedGenre !== "All" && (
              <span className="text-sm font-normal text-zinc-400">
                · {selectedGenre}
              </span>
            )}
          </h2>
          <span className="text-xs text-zinc-500">
            {displayedMovies.length} titles
          </span>
        </div>

        {displayedMovies.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
            <Film className="h-10 w-10 text-zinc-600 mb-2" />
            <p className="text-zinc-300 font-medium">No movies found</p>
            <p className="text-xs text-zinc-500 mt-1">
              Try adjusting your search query or genre filter.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {displayedMovies.map((movie, index) => {
              const extId = String(movie.externalId);
              return (
                <MovieCard
                  key={extId}
                  movie={movie}
                  priority={index < 6}
                  tracked={trackedMap.get(extId)}
                  isPending={pendingIds.has(extId)}
                  onUpdateStatus={handleUpdateStatus}
                />
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
