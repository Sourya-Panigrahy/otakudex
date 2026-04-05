const JIKAN_BASE = "https://api.jikan.moe/v4";

export type AnimeListDto = {
  mal_id: number;
  title: string;
  title_english: string | null;
  image_url: string | null;
  episodes: number | null;
};

export type AnimeDetailDto = AnimeListDto & {
  synopsis: string | null;
  url: string | null;
  status: string | null;
  /** TV, Movie, OVA, etc. */
  media_type: string | null;
  aired: string | null;
  duration: string | null;
  rating: string | null;
  score: number | null;
  genres: string[];
};

type JikanImageSet = {
  jpg: { image_url: string | null; large_image_url: string | null };
};

type JikanAnimeBrief = {
  mal_id: number;
  title: string;
  title_english: string | null;
  images: JikanImageSet;
  episodes: number | null;
  synopsis?: string | null;
};

type JikanAired = {
  string?: string | null;
};

type JikanGenre = { name: string };

type JikanAnimeFull = JikanAnimeBrief & {
  url?: string | null;
  status?: string | null;
  type?: string | null;
  aired?: JikanAired | null;
  duration?: string | null;
  rating?: string | null;
  score?: number | null;
  genres?: JikanGenre[] | null;
};

type JikanListResponse = { data: JikanAnimeBrief[] };
type JikanSingleResponse = { data: JikanAnimeFull };

function mapBrief(a: JikanAnimeBrief): AnimeListDto {
  const imageUrl =
    a.images?.jpg?.large_image_url ?? a.images?.jpg?.image_url ?? null;
  return {
    mal_id: a.mal_id,
    title: a.title,
    title_english: a.title_english,
    image_url: imageUrl,
    episodes: a.episodes,
  };
}

/** Jikan occasionally returns the same `mal_id` twice in one page; React keys must be unique. */
function dedupeAnimeListByMalId(items: AnimeListDto[]): AnimeListDto[] {
  const seen = new Set<number>();
  const out: AnimeListDto[] = [];
  for (const item of items) {
    if (seen.has(item.mal_id)) continue;
    seen.add(item.mal_id);
    out.push(item);
  }
  return out;
}

export async function searchAnime(query: string): Promise<AnimeListDto[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL(`${JIKAN_BASE}/anime`);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", "24");

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Jikan search failed: ${res.status}`);
  }

  const json = (await res.json()) as JikanListResponse;
  return dedupeAnimeListByMalId((json.data ?? []).map(mapBrief));
}

/** Currently airing this season (Jikan “seasons now”). */
export async function getSeasonsNow(limit = 12): Promise<AnimeListDto[]> {
  const url = new URL(`${JIKAN_BASE}/seasons/now`);
  url.searchParams.set("limit", String(Math.min(limit, 25)));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Jikan seasons/now failed: ${res.status}`);
  }

  const json = (await res.json()) as JikanListResponse;
  return dedupeAnimeListByMalId((json.data ?? []).map(mapBrief));
}

/** Next season’s announced titles (Jikan “seasons upcoming”). */
export async function getSeasonsUpcoming(limit = 12): Promise<AnimeListDto[]> {
  const url = new URL(`${JIKAN_BASE}/seasons/upcoming`);
  url.searchParams.set("limit", String(Math.min(limit, 25)));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Jikan seasons/upcoming failed: ${res.status}`);
  }

  const json = (await res.json()) as JikanListResponse;
  return dedupeAnimeListByMalId((json.data ?? []).map(mapBrief));
}

export type CharacterCardDto = {
  mal_id: number;
  name: string;
  image_url: string | null;
  role: string | null;
};

export async function getAnimeCharacters(
  malId: number
): Promise<CharacterCardDto[]> {
  if (!Number.isFinite(malId) || malId <= 0) return [];

  const res = await fetch(`${JIKAN_BASE}/anime/${malId}/characters`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];

  const json = (await res.json()) as {
    data?: Array<{
      character?: {
        mal_id: number;
        name: string;
        images?: { jpg?: { image_url?: string | null } };
      };
      role?: string;
    }>;
  };

  const out: CharacterCardDto[] = [];
  for (const item of json.data ?? []) {
    const c = item.character;
    if (!c?.mal_id) continue;
    out.push({
      mal_id: c.mal_id,
      name: c.name,
      image_url: c.images?.jpg?.image_url ?? null,
      role: item.role ?? null,
    });
    if (out.length >= 14) break;
  }
  return out;
}

export async function getAnimeRecommendations(
  malId: number
): Promise<AnimeListDto[]> {
  if (!Number.isFinite(malId) || malId <= 0) return [];

  const res = await fetch(`${JIKAN_BASE}/anime/${malId}/recommendations`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];

  const json = (await res.json()) as {
    data?: Array<{
      entry?: JikanAnimeBrief;
    }>;
  };

  const briefs: JikanAnimeBrief[] = [];
  for (const item of json.data ?? []) {
    if (item.entry) briefs.push(item.entry);
  }
  return dedupeAnimeListByMalId(briefs.map(mapBrief)).slice(0, 12);
}

export async function getAnimeByMalId(
  malId: number
): Promise<AnimeDetailDto | null> {
  if (!Number.isFinite(malId) || malId <= 0) return null;

  const res = await fetch(`${JIKAN_BASE}/anime/${malId}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as JikanSingleResponse;
  if (!json.data) return null;

  const d = json.data;
  const brief = mapBrief(d);
  const genres = (d.genres ?? []).map((g) => g.name).filter(Boolean);

  return {
    ...brief,
    synopsis: d.synopsis ?? null,
    url: d.url ?? null,
    status: d.status ?? null,
    media_type: d.type ?? null,
    aired: d.aired?.string ?? null,
    duration: d.duration ?? null,
    rating: d.rating ?? null,
    score: d.score ?? null,
    genres,
  };
}
