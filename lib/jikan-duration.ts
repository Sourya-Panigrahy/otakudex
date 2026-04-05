/**
 * Derive minutes counted per `watched_episodes` increment from Jikan's `duration` string.
 * TV: "24 min per ep" → 24. Movie / one-shot: full runtime when parsable.
 */
export function inferMinutesPerWatchedEpisode(opts: {
  duration: string | null;
  mediaType: string | null;
  totalEpisodes: number | null;
}): number | null {
  const d = opts.duration?.trim() ?? "";
  if (!d || /unknown/i.test(d)) return null;

  const perEp = d.match(
    /(\d+)\s*min(?:\.|ute)?s?\s*(?:per|\/)\s*ep/i
  );
  if (perEp) {
    const n = Number.parseInt(perEp[1], 10);
    if (Number.isFinite(n) && n > 0) return Math.min(200, Math.max(1, n));
  }

  const isFilm =
    opts.mediaType?.toLowerCase() === "movie" ||
    opts.totalEpisodes === 1;

  if (isFilm) {
    let mins = 0;
    const hr = d.match(/(\d+)\s*hr/i);
    const minOnly = d.match(/(\d+)\s*min/i);
    if (hr) mins += Number.parseInt(hr[1], 10) * 60;
    if (minOnly) mins += Number.parseInt(minOnly[1], 10);
    if (mins > 0) return Math.min(400, mins);
  }

  const leadMin = d.match(/^(\d+)\s*min/i);
  if (leadMin) {
    const n = Number.parseInt(leadMin[1], 10);
    if (Number.isFinite(n) && n > 0) return Math.min(200, Math.max(1, n));
  }

  return null;
}

/** When Jikan duration is missing, assume a standard TV episode length. */
export const DEFAULT_MINUTES_PER_EPISODE = 24;
