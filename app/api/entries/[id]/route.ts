import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/db";
import { animeEntries } from "@/db/schema";
import { isEntryStatus } from "@/lib/entry-status";
import { getAnimeByMalId } from "@/lib/jikan";

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
    }
  }

  if (totalEpisodes != null) {
    watchedEpisodes = Math.min(watchedEpisodes, totalEpisodes);
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
      updatedAt: new Date(),
    })
    .where(eq(animeEntries.id, id))
    .returning();

  return NextResponse.json({ entry: updated });
}
