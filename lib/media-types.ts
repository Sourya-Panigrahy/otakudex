export const MEDIA_TYPES = [
  "movie",
  "tv",
  "web_series",
  "anime",
] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  movie: "Movie",
  tv: "TV Show",
  web_series: "Web Series",
  anime: "Anime",
};

export const MEDIA_PROVIDERS = ["tmdb", "jikan", "custom"] as const;
export type MediaProvider = (typeof MEDIA_PROVIDERS)[number];

export const MEDIA_STATUSES = [
  "plan_to_watch",
  "watching",
  "on_hold",
  "completed",
  "dropped",
] as const;

export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const MEDIA_STATUS_LABEL: Record<MediaStatus, string> = {
  plan_to_watch: "Plan to Watch",
  watching: "Watching",
  on_hold: "On Hold",
  completed: "Watched",
  dropped: "Dropped",
};

export function isMediaType(value: unknown): value is MediaType {
  return typeof value === "string" && (MEDIA_TYPES as readonly string[]).includes(value);
}

export function isMediaStatus(value: unknown): value is MediaStatus {
  return typeof value === "string" && (MEDIA_STATUSES as readonly string[]).includes(value);
}

export interface UniversalMediaDto {
  id: string | number;
  externalId: string;
  provider: MediaProvider;
  mediaType: MediaType;
  title: string;
  originalTitle?: string | null;
  overview?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  releaseDate?: string | null;
  releaseYear?: number | null;
  genres: string[];
  airStatus?: string | null;
  ratingAverage?: number | null;
  voteCount?: number | null;
  runtimeMinutes?: number | null;
  totalEpisodes?: number | null;
  totalSeasons?: number | null;
}
