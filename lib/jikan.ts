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
type JikanPaginatedListResponse = {
  pagination?: {
    last_visible_page?: number;
    has_next_page?: boolean;
    current_page?: number;
  };
  data?: JikanAnimeBrief[];
};
type JikanSingleResponse = { data: JikanAnimeFull };

/** Prefer CDN host so Next/Image fetches are faster than myanimelist.net (fewer optimizer timeouts). */
function normalizeMalImageUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "myanimelist.net" && u.pathname.startsWith("/images/")) {
      u.hostname = "cdn.myanimelist.net";
      return u.toString();
    }
  } catch {
    return url;
  }
  return url;
}

function mapBrief(a: JikanAnimeBrief): AnimeListDto {
  const imageUrl = normalizeMalImageUrl(
    a.images?.jpg?.large_image_url ?? a.images?.jpg?.image_url ?? null
  );
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

export type SeasonsBrowseKind = "now" | "upcoming";

export type SeasonsBrowseResult = {
  data: AnimeListDto[];
  currentPage: number;
  hasNextPage: boolean;
  lastPage: number;
};

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function rotateSlice(items: AnimeListDto[], start: number, size: number): AnimeListDto[] {
  if (items.length === 0 || size <= 0) return [];
  if (items.length <= size) return items.slice(0, size);
  const out: AnimeListDto[] = [];
  for (let i = 0; i < size; i++) {
    out.push(items[(start + i) % items.length]);
  }
  return out;
}

/**
 * Paginated seasons list (Jikan `seasons/now` or `seasons/upcoming`).
 * `page` and `limit` are clamped (limit max 25 per Jikan).
 */
export async function getSeasonsBrowse(
  kind: SeasonsBrowseKind,
  page: number,
  limit = 25
): Promise<SeasonsBrowseResult> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeLimit = Math.min(25, Math.max(1, Math.floor(limit) || 25));
  const path = kind === "now" ? "seasons/now" : "seasons/upcoming";
  const url = new URL(`${JIKAN_BASE}/${path}`);
  url.searchParams.set("page", String(safePage));
  url.searchParams.set("limit", String(safeLimit));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Jikan ${path} failed: ${res.status}`);
  }

  const json = (await res.json()) as JikanPaginatedListResponse;
  const p = json.pagination;
  const data = dedupeAnimeListByMalId((json.data ?? []).map(mapBrief));
  const currentPage = p?.current_page ?? safePage;
  const lastPage = Math.max(1, p?.last_visible_page ?? currentPage);
  const hasNextPage = Boolean(p?.has_next_page);

  return {
    data,
    currentPage,
    hasNextPage,
    lastPage,
  };
}

/**
 * Jikan sometimes returns exactly 11 rows on page 1 while `hasNextPage` is
 * true. Appending the first item from page 2 fills a 6×2 grid on the home
 * teaser (otherwise the last cell looks empty).
 */
export async function padSeasonFirstPageIfEleven(
  kind: SeasonsBrowseKind,
  data: AnimeListDto[],
  hasNextPage: boolean
): Promise<AnimeListDto[]> {
  if (data.length !== 11 || !hasNextPage) return data;
  const peek = await getSeasonsBrowse(kind, 2, 1);
  const extra = peek.data[0];
  if (!extra || data.some((d) => d.mal_id === extra.mal_id)) return data;
  return [...data, extra];
}

/** Currently airing this season (Jikan “seasons now”), first page only. */
export async function getSeasonsNow(limit = 12): Promise<AnimeListDto[]> {
  const cap = Math.min(limit, 25);
  const { data, hasNextPage } = await getSeasonsBrowse("now", 1, cap);
  const padded = await padSeasonFirstPageIfEleven("now", data, hasNextPage);
  return padded.slice(0, cap);
}

/** Next season’s announced titles (Jikan “seasons upcoming”), first page only. */
export async function getSeasonsUpcoming(limit = 12): Promise<AnimeListDto[]> {
  const cap = Math.min(limit, 25);
  const { data, hasNextPage } = await getSeasonsBrowse("upcoming", 1, cap);
  const padded = await padSeasonFirstPageIfEleven("upcoming", data, hasNextPage);
  return padded.slice(0, cap);
}

/**
 * Returns a varied "upcoming" slice for home feed:
 * - combines up to first 2 pages
 * - rotates start index using a deterministic seed (e.g. user+day)
 */
export async function getSeasonsUpcomingVaried(opts: {
  limit?: number;
  seed: string;
}): Promise<AnimeListDto[]> {
  const cap = Math.min(Math.max(1, opts.limit ?? 12), 25);
  const first = await getSeasonsBrowse("upcoming", 1, 25);
  let pool = first.data;
  if (first.hasNextPage) {
    try {
      const second = await getSeasonsBrowse("upcoming", 2, 25);
      pool = dedupeAnimeListByMalId([...pool, ...second.data]);
    } catch {
      // If extra page fetch fails (rate limit / timeout), still serve page 1.
    }
  }

  const padded = await padSeasonFirstPageIfEleven(
    "upcoming",
    pool,
    first.hasNextPage
  );
  if (padded.length <= cap) return padded.slice(0, cap);
  const start = hashString(opts.seed) % padded.length;
  return rotateSlice(padded, start, cap);
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
      image_url: normalizeMalImageUrl(c.images?.jpg?.image_url ?? null),
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
