import { NextResponse } from "next/server";

import { getSeasonsBrowse, type SeasonsBrowseKind } from "@/lib/jikan";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawKind = searchParams.get("kind");
  const kind: SeasonsBrowseKind = rawKind === "upcoming" ? "upcoming" : "now";
  const rawPage = searchParams.get("page") ?? "1";
  const page = Math.max(1, Number.parseInt(rawPage, 10) || 1);

  try {
    const res = await getSeasonsBrowse(kind, page, 24);
    return NextResponse.json({
      data: res.data,
      currentPage: res.currentPage,
      hasNextPage: res.hasNextPage,
      lastPage: res.lastPage,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch seasonal anime" },
      { status: 502 }
    );
  }
}
