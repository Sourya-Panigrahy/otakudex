import { type MediaStatus, type MediaType } from "./media-types";

export interface CanCompleteOptions {
  mediaType: MediaType;
  airStatus?: string | null;
  progress: number;
  totalProgress?: number | null;
}

/** Check if media can be marked as completed. */
export function mayMarkMediaCompleted(options: CanCompleteOptions): {
  ok: boolean;
  message?: string;
} {
  const { mediaType, airStatus, progress, totalProgress } = options;

  // For Movies, watching is complete once watched
  if (mediaType === "movie") {
    return { ok: true };
  }

  // If currently ongoing / airing and episodes remain unknown or incomplete
  const isAiring =
    airStatus === "Returning Series" ||
    airStatus === "Currently Airing" ||
    airStatus === "In Production";

  if (isAiring) {
    return {
      ok: false,
      message:
        "This series is currently still releasing episodes. Use Watching until the series concludes.",
    };
  }

  if (totalProgress != null && totalProgress > 0 && progress < totalProgress) {
    return {
      ok: false,
      message: `Progress is ${progress}/${totalProgress}. Watch all episodes before marking as Watched.`,
    };
  }

  return { ok: true };
}

/** Determine whether media should automatically switch to 'completed' status */
export function shouldAutoMediaComplete(options: {
  mediaType: MediaType;
  airStatus?: string | null;
  progress: number;
  totalProgress?: number | null;
  explicitPlanToWatch?: boolean;
}): boolean {
  const { mediaType, airStatus, progress, totalProgress, explicitPlanToWatch } = options;
  if (explicitPlanToWatch) return false;

  if (mediaType === "movie") {
    return progress >= 1;
  }

  const isAiring =
    airStatus === "Returning Series" ||
    airStatus === "Currently Airing" ||
    airStatus === "In Production";

  if (isAiring) return false;
  if (totalProgress == null || totalProgress <= 0) return false;

  return progress >= totalProgress;
}

/** Calculate total watch hours/days across items */
export function calculateMediaWatchStats(
  items: Array<{
    mediaType: string;
    progress: number;
    minutesPerEpisode?: number | null;
  }>
) {
  let totalMinutes = 0;
  let totalItemsWatched = 0;

  for (const item of items) {
    const minutes = item.minutesPerEpisode && item.minutesPerEpisode > 0
      ? item.minutesPerEpisode
      : item.mediaType === "movie"
      ? 110 // average movie length default ~110 mins
      : 45; // average TV / web series episode default ~45 mins

    totalMinutes += item.progress * minutes;
    if (item.progress > 0) totalItemsWatched += 1;
  }

  const hours = totalMinutes / 60;
  const days = totalMinutes / (60 * 24);

  return {
    totalMinutes,
    hours: Math.round(hours * 10) / 10,
    days: Math.round(days * 10) / 10,
    totalItemsWatched,
  };
}
