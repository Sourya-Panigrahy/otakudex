import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/db";
import { mediaEntries } from "@/db/schema";
import {
  isMediaStatus,
  isMediaType,
  type MediaStatus,
  type MediaType,
} from "@/lib/media-types";
import { mayMarkMediaCompleted } from "@/lib/media-rules";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mediaType = searchParams.get("type");
  const status = searchParams.get("status");

  const conditions = [eq(mediaEntries.userId, session.user.id)];

  if (mediaType && isMediaType(mediaType)) {
    conditions.push(eq(mediaEntries.mediaType, mediaType));
  }

  if (status && isMediaStatus(status)) {
    conditions.push(eq(mediaEntries.status, status));
  }

  const rows = await db
    .select()
    .from(mediaEntries)
    .where(and(...conditions))
    .orderBy(desc(mediaEntries.updatedAt));

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

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as {
    mediaType?: unknown;
    provider?: unknown;
    externalId?: unknown;
    status?: unknown;
    title?: unknown;
    titleEn?: unknown;
    posterUrl?: unknown;
    backdropUrl?: unknown;
    overview?: unknown;
    releaseDate?: unknown;
    genres?: unknown;
    airStatus?: unknown;
    runtimeMinutes?: unknown;
    totalEpisodes?: unknown;
    totalSeasons?: unknown;
    progress?: unknown;
  };

  const mediaType = String(b.mediaType || "movie") as MediaType;
  const status = String(b.status || "plan_to_watch") as MediaStatus;
  const externalId = String(b.externalId || "");
  const title = String(b.title || "Untitled");
  const provider = String(b.provider || "tmdb");

  if (!externalId) {
    return NextResponse.json({ error: "externalId is required" }, { status: 400 });
  }
  if (!isMediaType(mediaType)) {
    return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
  }
  if (!isMediaStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Check if entry already exists
  const existing = await db
    .select()
    .from(mediaEntries)
    .where(
      and(
        eq(mediaEntries.userId, session.user.id),
        eq(mediaEntries.provider, provider),
        eq(mediaEntries.externalId, externalId),
        eq(mediaEntries.mediaType, mediaType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Already in your list", entry: existing[0] },
      { status: 409 }
    );
  }

  const totalProgress =
    mediaType === "movie"
      ? 1
      : b.totalEpisodes && Number.isFinite(Number(b.totalEpisodes))
      ? Number(b.totalEpisodes)
      : null;

  let progress = 0;
  if (status === "completed") {
    progress = totalProgress ?? 1;
  } else if (b.progress && Number.isFinite(Number(b.progress))) {
    progress = Number(b.progress);
  }

  const airStatus = b.airStatus ? String(b.airStatus) : null;

  if (status === "completed") {
    const check = mayMarkMediaCompleted({
      mediaType,
      airStatus,
      progress,
      totalProgress,
    });
    if (!check.ok) {
      return NextResponse.json({ error: check.message }, { status: 400 });
    }
  }

  const genresJson = Array.isArray(b.genres) ? JSON.stringify(b.genres) : null;

  const [inserted] = await db
    .insert(mediaEntries)
    .values({
      userId: session.user.id,
      mediaType,
      provider,
      externalId,
      status,
      progress,
      totalProgress,
      totalSeasons: b.totalSeasons ? Number(b.totalSeasons) : null,
      minutesPerEpisode: b.runtimeMinutes ? Number(b.runtimeMinutes) : null,
      titleEn: b.titleEn ? String(b.titleEn) : null,
      titleDefault: title,
      imageUrl: b.posterUrl ? String(b.posterUrl) : null,
      backdropUrl: b.backdropUrl ? String(b.backdropUrl) : null,
      overview: b.overview ? String(b.overview) : null,
      genresJson,
      airStatus,
      releaseDate: b.releaseDate ? String(b.releaseDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json({ entry: inserted }, { status: 201 });
}
