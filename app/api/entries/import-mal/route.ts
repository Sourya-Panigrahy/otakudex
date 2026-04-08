import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/db";
import { animeEntries } from "@/db/schema";
import { getAnimeByMalId } from "@/lib/jikan";
import { inferMinutesPerWatchedEpisode } from "@/lib/jikan-duration";
import {
  malListStatusToEntryStatus,
  resolveImportRow,
} from "@/lib/mal-import-map";
import { normalizeMalListStatus } from "@/lib/mal-list-status";

const JIKAN_GAP_MS = 340;
const MAX_ITEMS = 20;

type ImportBody = {
  items: Array<{
    mal_id: number;
    mal_list_status: number;
    watched_episodes: number;
  }>;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("items" in body) ||
    !Array.isArray((body as ImportBody).items)
  ) {
    return NextResponse.json(
      { error: "Expected { items: [...] }" },
      { status: 400 }
    );
  }

  const items = (body as ImportBody).items;
  if (items.length === 0 || items.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `Provide 1–${MAX_ITEMS} items per request` },
      { status: 400 }
    );
  }

  let imported = 0;
  let skipped = 0;
  let dropped = 0;
  const errors: string[] = [];
  let didFetch = false;

  for (const raw of items) {
    const malId = Number(raw.mal_id);
    const malListStatus = normalizeMalListStatus(
      raw.mal_list_status != null ? String(raw.mal_list_status) : null
    );
    const watchedFromMal = Number(raw.watched_episodes) || 0;

    if (!Number.isFinite(malId) || malId <= 0) continue;

    const mapped = malListStatusToEntryStatus(malListStatus);
    if (mapped === "skip") {
      dropped += 1;
      continue;
    }

    if (didFetch) {
      await new Promise((r) => setTimeout(r, JIKAN_GAP_MS));
    }

    const anime = await getAnimeByMalId(malId);
    didFetch = true;

    if (!anime) {
      errors.push(`MAL #${malId}: not found`);
      continue;
    }

    const existing = await db
      .select({ id: animeEntries.id })
      .from(animeEntries)
      .where(
        and(
          eq(animeEntries.userId, session.user.id),
          eq(animeEntries.malId, malId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      skipped += 1;
      continue;
    }

    const { status, watchedEpisodes } = resolveImportRow(
      anime,
      mapped,
      watchedFromMal
    );

    const minutesPerEpisode = inferMinutesPerWatchedEpisode({
      duration: anime.duration,
      mediaType: anime.media_type,
      totalEpisodes: anime.episodes,
    });

    await db.insert(animeEntries).values({
      userId: session.user.id,
      malId,
      status,
      watchedEpisodes,
      totalEpisodes: anime.episodes,
      titleEn: anime.title_english,
      titleDefault: anime.title,
      imageUrl: anime.image_url,
      genresJson: JSON.stringify(anime.genres.slice(0, 10)),
      mediaType: anime.media_type,
      airStatus: anime.status,
      minutesPerEpisode,
      updatedAt: new Date(),
    });

    imported += 1;
  }

  return NextResponse.json({
    imported,
    skipped,
    dropped,
    errors: errors.slice(0, 20),
  });
}
