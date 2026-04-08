import type { EntryStatus } from "@/lib/entry-status";
import { mayAddAsCompleted, mayMarkCompleted } from "@/lib/list-entry-rules";
import type { AnimeDetailDto } from "@/lib/jikan";

/** MAL export `my_status`: 1 watching, 2 completed, 3 on hold, 4 dropped, 6 plan */
export function malListStatusToEntryStatus(
  malListStatus: number
): EntryStatus | "skip" {
  switch (malListStatus) {
    case 1:
      return "watching";
    case 2:
      return "completed";
    case 3:
      return "on_hold";
    case 4:
      return "skip";
    case 6:
      return "plan_to_watch";
    default:
      return "plan_to_watch";
  }
}

/**
 * Applies Jikan/airing rules on top of MAL list intent.
 * `mappedStatus` must not be `"skip"` (drop those before calling).
 */
export function resolveImportRow(
  anime: AnimeDetailDto,
  mappedStatus: EntryStatus,
  watchedFromMal: number
): { status: EntryStatus; watchedEpisodes: number } {
  let status = mappedStatus;
  let watched = Math.max(0, watchedFromMal);
  const total = anime.episodes;

  if (total != null && total > 0) {
    watched = Math.min(watched, total);
  }

  if (status === "completed") {
    if (!mayAddAsCompleted(anime.status).ok) {
      return { status: "watching", watchedEpisodes: watched };
    }
    const mark = mayMarkCompleted({
      airStatus: anime.status,
      watchedEpisodes: watched,
      totalEpisodes: total,
    });
    if (!mark.ok) {
      return { status: "watching", watchedEpisodes: watched };
    }
  }

  if (status === "plan_to_watch") {
    watched = 0;
  }

  if (status === "completed" && total != null && total > 0 && watched < total) {
    return { status: "watching", watchedEpisodes: watched };
  }

  return { status, watchedEpisodes: watched };
}
