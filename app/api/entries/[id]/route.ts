import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/db";
import { animeEntries } from "@/db/schema";
import { isEntryStatus } from "@/lib/entry-status";
import { getAnimeByMalId } from "@/lib/jikan";
import { inferMinutesPerWatchedEpisode } from "@/lib/jikan-duration";
import {
  mayMarkCompleted,
  shouldAutoComplete,
} from "@/lib/list-entry-rules";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as {
    watched_episodes?: unknown;
    status?: unknown;
    refresh_from_jikan?: unknown;
  };

  const [row] = await db
    .select()
    .from(animeEntries)
    .where(
      and(eq(animeEntries.id, id), eq(animeEntries.userId, session.user.id))
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let watchedEpisodes = row.watchedEpisodes;
  let nextStatus = row.status;
  let totalEpisodes = row.totalEpisodes;
  let titleEn = row.titleEn;
  let titleDefault = row.titleDefault;
  let imageUrl = row.imageUrl;
  let genresJson = row.genresJson;
  let mediaType = row.mediaType;
  let airStatus = row.airStatus;
  let minutesPerEpisode = row.minutesPerEpisode;

  if (b.status !== undefined) {
    const s = String(b.status);
    if (!isEntryStatus(s)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    nextStatus = s;
  }

  if (b.watched_episodes !== undefined) {
    const n = Number(b.watched_episodes);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      return NextResponse.json(
        { error: "watched_episodes must be a non-negative integer" },
        { status: 400 }
      );
    }
    watchedEpisodes = n;
  }

  if (b.refresh_from_jikan === true) {
    const anime = await getAnimeByMalId(row.malId);
    if (anime) {
      totalEpisodes = anime.episodes;
      titleEn = anime.title_english;
      titleDefault = anime.title;
      imageUrl = anime.image_url;
      genresJson = JSON.stringify(anime.genres.slice(0, 10));
      mediaType = anime.media_type;
      airStatus = anime.status;
      minutesPerEpisode = inferMinutesPerWatchedEpisode({
        duration: anime.duration,
        mediaType: anime.media_type,
        totalEpisodes: anime.episodes,
      });
    }
  }

  if (totalEpisodes != null) {
    watchedEpisodes = Math.min(watchedEpisodes, totalEpisodes);
  }

  const explicitPlanToWatch =
    b.status === "plan_to_watch" ||
    (b.status === undefined && row.status === "plan_to_watch");

  const autoCompleted = shouldAutoComplete({
    airStatus,
    watchedEpisodes,
    totalEpisodes,
    explicitPlanToWatch,
  });

  if (autoCompleted) {
    nextStatus = "completed";
  }

  if (
    nextStatus === "completed" &&
    totalEpisodes != null &&
    totalEpisodes > 0
  ) {
    watchedEpisodes = totalEpisodes;
  }

  /** User or auto is (re)asserting Watched, not just carrying an old value. */
  const assertedCompleted =
    b.status === "completed" ||
    autoCompleted ||
    (nextStatus === "completed" && row.status !== "completed");

  if (nextStatus === "completed") {
    const check = mayMarkCompleted({
      airStatus,
      watchedEpisodes,
      totalEpisodes,
    });
    if (!check.ok) {
      if (row.status === "completed" && !assertedCompleted) {
        /* Legacy row: allow metadata / episode tweaks without re-validating. */
      } else {
        return NextResponse.json({ error: check.message }, { status: 400 });
      }
    }
  }

  const [updated] = await db
    .update(animeEntries)
    .set({
      status: nextStatus,
      watchedEpisodes,
      totalEpisodes,
      titleEn,
      titleDefault,
      imageUrl,
      genresJson,
      mediaType,
      airStatus,
      minutesPerEpisode,
      updatedAt: new Date(),
    })
    .where(eq(animeEntries.id, id))
    .returning();

  return NextResponse.json({ entry: updated });
}
