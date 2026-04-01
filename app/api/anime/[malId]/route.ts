import { NextResponse } from "next/server";

import { getAnimeByMalId } from "@/lib/jikan";

type RouteContext = { params: Promise<{ malId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { malId: raw } = await context.params;
  const malId = Number.parseInt(raw, 10);
  if (!Number.isFinite(malId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const anime = await getAnimeByMalId(malId);
  if (!anime) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: anime });
}
