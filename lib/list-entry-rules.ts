/** Jikan anime `status` when the series is still releasing episodes. */
export function isCurrentlyAiring(airStatus: string | null | undefined): boolean {
  return airStatus === "Currently Airing";
}

/** Adding a brand-new row as Watched (episodes start at 0). */
export function mayAddAsCompleted(airStatus: string | null):
  | { ok: true }
  | { ok: false; message: string } {
  if (isCurrentlyAiring(airStatus)) {
    return {
      ok: false,
      message:
        "Still-airing shows cannot be added as Watched. Add as Watching, On hold, or Plan to watch.",
    };
  }
  return { ok: true };
}

export function mayMarkCompleted(opts: {
  airStatus: string | null;
  watchedEpisodes: number;
  totalEpisodes: number | null;
}):
  | { ok: true }
  | { ok: false; message: string } {
  if (isCurrentlyAiring(opts.airStatus)) {
    return {
      ok: false,
      message:
        "This series is still airing. Use Watching until it finishes — Watched is only for completed runs.",
    };
  }
  if (
    opts.totalEpisodes != null &&
    opts.totalEpisodes > 0 &&
    opts.watchedEpisodes < opts.totalEpisodes
  ) {
    return {
      ok: false,
      message: `Watch all ${opts.totalEpisodes} episodes before marking as Watched.`,
    };
  }
  return { ok: true };
}

/** When true, list status should be forced to completed after this update. */
export function shouldAutoComplete(opts: {
  airStatus: string | null;
  watchedEpisodes: number;
  totalEpisodes: number | null;
  /** If the client sent plan_to_watch, do not auto-switch to completed. */
  explicitPlanToWatch: boolean;
}): boolean {
  if (opts.explicitPlanToWatch) return false;
  if (isCurrentlyAiring(opts.airStatus)) return false;
  if (opts.totalEpisodes == null || opts.totalEpisodes <= 0) return false;
  return opts.watchedEpisodes >= opts.totalEpisodes;
}
