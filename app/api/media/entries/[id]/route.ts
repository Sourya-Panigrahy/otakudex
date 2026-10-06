import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/db";
import { mediaEntries } from "@/db/schema";
import { isMediaStatus, type MediaStatus, type MediaType } from "@/lib/media-types";
import { mayMarkMediaCompleted, shouldAutoMediaComplete } from "@/lib/media-rules";

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
    status?: unknown;
    progress?: unknown;
    rating?: unknown;
    notes?: unknown;
  };

  const [row] = await db
    .select()
    .from(mediaEntries)
    .where(and(eq(mediaEntries.id, id), eq(mediaEntries.userId, session.user.id)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let nextStatus = row.status as MediaStatus;
  let nextProgress = row.progress;
  let nextRating = row.rating;

  if (b.status !== undefined) {
    const s = String(b.status);
    if (!isMediaStatus(s)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    nextStatus = s;
  }

  if (b.progress !== undefined) {
    const p = Number(b.progress);
    if (!Number.isFinite(p) || p < 0 || !Number.isInteger(p)) {
      return NextResponse.json(
        { error: "Progress must be a non-negative integer" },
        { status: 400 }
      );
    }
    nextProgress = p;
  }

  if (b.rating !== undefined) {
    if (b.rating === null) {
      nextRating = null;
    } else {
      const r = Number(b.rating);
      if (!Number.isFinite(r) || r < 1 || r > 10) {
        return NextResponse.json(
          { error: "Rating must be between 1 and 10" },
          { status: 400 }
        );
      }
      nextRating = r;
    }
  }

  // Handle totalProgress boundary
  if (row.totalProgress != null && row.totalProgress > 0) {
    nextProgress = Math.min(nextProgress, row.totalProgress);
  }

  const explicitPlanToWatch =
    b.status === "plan_to_watch" ||
    (b.status === undefined && row.status === "plan_to_watch");

  const autoCompleted = shouldAutoMediaComplete({
    mediaType: row.mediaType as MediaType,
    airStatus: row.airStatus,
    progress: nextProgress,
    totalProgress: row.totalProgress,
    explicitPlanToWatch,
  });

  if (autoCompleted) {
    nextStatus = "completed";
  }

  if (nextStatus === "completed" && row.mediaType === "movie") {
    nextProgress = 1;
  } else if (
    nextStatus === "completed" &&
    row.totalProgress != null &&
    row.totalProgress > 0
  ) {
    nextProgress = row.totalProgress;
  }

  if (nextStatus === "completed") {
    const check = mayMarkMediaCompleted({
      mediaType: row.mediaType as MediaType,
      airStatus: row.airStatus,
      progress: nextProgress,
      totalProgress: row.totalProgress,
    });
    if (!check.ok) {
      return NextResponse.json({ error: check.message }, { status: 400 });
    }
  }

  const [updated] = await db
    .update(mediaEntries)
    .set({
      status: nextStatus,
      progress: nextProgress,
      rating: nextRating,
      updatedAt: new Date(),
    })
    .where(eq(mediaEntries.id, id))
    .returning();

  return NextResponse.json({ entry: updated });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const [deleted] = await db
    .delete(mediaEntries)
    .where(and(eq(mediaEntries.id, id), eq(mediaEntries.userId, session.user.id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, entry: deleted });
}
