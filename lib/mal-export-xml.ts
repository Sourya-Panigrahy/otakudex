/**
 * Parses MyAnimeList’s exported anime list XML (animelist.xml).
 * Works in the browser and on the server (no DOM).
 */

import { normalizeMalListStatus } from "@/lib/mal-list-status";

export type MalParsedAnime = {
  malId: number;
  /** MAL list status: 1 watching, 2 completed, 3 on hold, 4 dropped, 6 plan */
  malListStatus: number;
  watchedEpisodes: number;
};

function getInner(xml: string, tag: string): string | null {
  const cdata = new RegExp(
    `<${tag}\\s*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}\\s*>`,
    "i"
  ).exec(xml);
  if (cdata?.[1] != null) return cdata[1].trim();
  const plain = new RegExp(
    `<${tag}\\s*>([^<]*)</${tag}\\s*>`,
    "i"
  ).exec(xml);
  return plain?.[1]?.trim() ?? null;
}

function parseIntSafe(s: string | null, fallback: number): number {
  if (s == null || s === "") return fallback;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Returns rows from MAL export XML, skipping invalid blocks. */
export function parseMalAnimeListXml(xml: string): MalParsedAnime[] {
  const trimmed = xml.trim();
  if (!trimmed.includes("<") || !trimmed.toLowerCase().includes("animelist")) {
    throw new Error("This file does not look like a MyAnimeList export.");
  }

  const animeBlocks = trimmed.match(/<anime\b[^>]*>[\s\S]*?<\/anime>/gi) ?? [];
  const out: MalParsedAnime[] = [];

  for (const block of animeBlocks) {
    const idRaw = getInner(block, "series_animedb_id");
    const malId = parseIntSafe(idRaw, 0);
    if (malId <= 0) continue;

    const malListStatus = normalizeMalListStatus(getInner(block, "my_status"));
    const watchedEpisodes = Math.max(
      0,
      parseIntSafe(getInner(block, "my_watched_episodes"), 0)
    );

    out.push({ malId, malListStatus, watchedEpisodes });
  }

  if (out.length === 0) {
    throw new Error("No anime entries found in this file.");
  }

  return out;
}
