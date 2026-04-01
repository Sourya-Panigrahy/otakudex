import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/db";
import { animeEntries } from "@/db/schema";
import { isEntryStatus } from "@/lib/entry-status";
import { getAnimeByMalId } from "@/lib/jikan";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const conditions = [eq(animeEntries.userId, session.user.id)];
  if (status && isEntryStatus(status)) {
    conditions.push(eq(animeEntries.status, status));
  }

  const rows = await db
    .select()
    .from(animeEntries)
    .where(and(...conditions));

  return NextResponse.json({ entries: rows });
}

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
    !("mal_id" in body) ||
    !("status" in body)
  ) {
    return NextResponse.json(
      { error: "Expected { mal_id: number, status: string }" },
      { status: 400 }
    );
  }

  const malId = Number((body as { mal_id: unknown }).mal_id);
  const status = String((body as { status: unknown }).status);

  if (!Number.isFinite(malId) || malId <= 0) {
    return NextResponse.json({ error: "Invalid mal_id" }, { status: 400 });
  }
  if (!isEntryStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(animeEntries)
    .where(
      and(
        eq(animeEntries.userId, session.user.id),
        eq(animeEntries.malId, malId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Already in list", entry: existing[0] },
      { status: 409 }
    );
  }

  const anime = await getAnimeByMalId(malId);
  if (!anime) {
    return NextResponse.json({ error: "Anime not found on Jikan" }, { status: 404 });
  }

  const [inserted] = await db
    .insert(animeEntries)
    .values({
      userId: session.user.id,
      malId,
      status,
      watchedEpisodes: 0,
      totalEpisodes: anime.episodes,
      titleEn: anime.title_english,
      titleDefault: anime.title,
      imageUrl: anime.image_url,
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ entry: inserted }, { status: 201 });
}
