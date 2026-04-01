import { NextResponse } from "next/server";

import { searchAnime } from "@/lib/jikan";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  try {
    const data = await searchAnime(q);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Failed to search anime" },
      { status: 502 }
    );
  }
}
