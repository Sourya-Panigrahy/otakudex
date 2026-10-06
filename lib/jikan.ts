const JIKAN_BASE = process.env.JIKAN_BASE_URL || "https://api.jikan.moe/v4";
const ANILIST_BASE = "https://graphql.anilist.co";

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

async function fetchJikanWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutMs = process.env.JIKAN_BASE_URL ? 5000 : 2000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function anilistGraphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ANILIST_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`AniList error ${res.status}`);
  }
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data as T;
}

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  return html
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

export async function searchAnime(query: string): Promise<AnimeListDto[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL(`${JIKAN_BASE}/anime`);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", "24");

  try {
    const res = await fetchJikanWithTimeout(url.toString(), { next: { revalidate: 60 } });
    if (res.ok) {
      const json = (await res.json()) as JikanListResponse;
      return dedupeAnimeListByMalId((json.data ?? []).map(mapBrief));
    }
  } catch {
    // Jikan failed or timed out — fall back to AniList
  }

  try {
    const data = await anilistGraphql<{
      Page?: {
        media?: Array<{
          id: number;
          idMal?: number | null;
          title: { romaji?: string | null; english?: string | null; userPreferred?: string | null };
          coverImage?: { large?: string | null; extraLarge?: string | null } | null;
          episodes?: number | null;
        }>;
      };
    }>(
      `query ($search: String) {
        Page(page: 1, perPage: 24) {
          media(type: ANIME, search: $search, sort: SEARCH_MATCH) {
            id
            idMal
            title { romaji english userPreferred }
            coverImage { large extraLarge }
            episodes
          }
        }
      }`,
      { search: trimmed }
    );
    const items: AnimeListDto[] = (data.Page?.media ?? []).map((m) => ({
      mal_id: m.idMal || m.id,
      title: m.title.english || m.title.romaji || m.title.userPreferred || `Anime ${m.id}`,
      title_english: m.title.english ?? null,
      image_url: m.coverImage?.extraLarge ?? m.coverImage?.large ?? null,
      episodes: m.episodes ?? null,
    }));
    return dedupeAnimeListByMalId(items);
  } catch {
    return [];
  }
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

  try {
    const res = await fetchJikanWithTimeout(url.toString(), { next: { revalidate: 3600 } });
    if (res.ok) {
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
  } catch {
    // Jikan failed or timed out — fall back to AniList
  }

  try {
    const statusFilter = kind === "now" ? "RELEASING" : "NOT_YET_RELEASED";
    const data = await anilistGraphql<{
      Page?: {
        pageInfo?: { hasNextPage?: boolean; lastPage?: number; currentPage?: number };
        media?: Array<{
          id: number;
          idMal?: number | null;
          title: { romaji?: string | null; english?: string | null; userPreferred?: string | null };
          coverImage?: { large?: string | null; extraLarge?: string | null } | null;
          episodes?: number | null;
        }>;
      };
    }>(
      `query ($page: Int, $perPage: Int, $status: MediaStatus) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { hasNextPage lastPage currentPage }
          media(type: ANIME, status: $status, sort: POPULARITY_DESC) {
            id
            idMal
            title { romaji english userPreferred }
            coverImage { large extraLarge }
            episodes
          }
        }
      }`,
      { page: safePage, perPage: safeLimit, status: statusFilter }
    );
    const p = data.Page?.pageInfo;
    const items: AnimeListDto[] = (data.Page?.media ?? []).map((m) => ({
      mal_id: m.idMal || m.id,
      title: m.title.english || m.title.romaji || m.title.userPreferred || `Anime ${m.id}`,
      title_english: m.title.english ?? null,
      image_url: m.coverImage?.extraLarge ?? m.coverImage?.large ?? null,
      episodes: m.episodes ?? null,
    }));
    return {
      data: dedupeAnimeListByMalId(items),
      currentPage: p?.currentPage ?? safePage,
      hasNextPage: Boolean(p?.hasNextPage),
      lastPage: p?.lastPage ?? safePage,
    };
  } catch {
    return {
      data: [],
      currentPage: safePage,
      hasNextPage: false,
      lastPage: 1,
    };
  }
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
export async function getSeasonsNow(limit = 24): Promise<AnimeListDto[]> {
  const cap = Math.min(limit, 25);
  const { data, hasNextPage } = await getSeasonsBrowse("now", 1, cap);
  const padded = await padSeasonFirstPageIfEleven("now", data, hasNextPage);
  return padded.slice(0, cap);
}

/** Next season’s announced titles (Jikan “seasons upcoming”), first page only. */
export async function getSeasonsUpcoming(limit = 24): Promise<AnimeListDto[]> {
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
  const cap = Math.min(Math.max(1, opts.limit ?? 24), 25);
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

  try {
    const res = await fetchJikanWithTimeout(`${JIKAN_BASE}/anime/${malId}/characters`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
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
  } catch {
    // Jikan failed — fall back to AniList
  }

  try {
    const data = await anilistGraphql<{
      Media?: {
        characters?: {
          edges?: Array<{
            role?: string | null;
            node?: {
              id: number;
              name?: { full?: string | null; userPreferred?: string | null };
              image?: { large?: string | null };
            };
          }>;
        };
      };
    }>(
      `query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
          characters(sort: ROLE, perPage: 14) {
            edges {
              role
              node {
                id
                name { full userPreferred }
                image { large }
              }
            }
          }
        }
      }`,
      { idMal: malId }
    );
    return (data.Media?.characters?.edges ?? []).map((e) => ({
      mal_id: e.node?.id ?? 0,
      name: e.node?.name?.full ?? e.node?.name?.userPreferred ?? "Character",
      image_url: e.node?.image?.large ?? null,
      role: e.role === "MAIN" ? "Main" : "Supporting",
    })).slice(0, 14);
  } catch {
    return [];
  }
}

export async function getAnimeRecommendations(
  malId: number
): Promise<AnimeListDto[]> {
  if (!Number.isFinite(malId) || malId <= 0) return [];

  try {
    const res = await fetchJikanWithTimeout(`${JIKAN_BASE}/anime/${malId}/recommendations`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
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
  } catch {
    // Jikan failed — fall back to AniList
  }

  try {
    const data = await anilistGraphql<{
      Media?: {
        recommendations?: {
          nodes?: Array<{
            mediaRecommendation?: {
              id: number;
              idMal?: number | null;
              title?: { romaji?: string | null; english?: string | null; userPreferred?: string | null };
              coverImage?: { large?: string | null; extraLarge?: string | null };
              episodes?: number | null;
            };
          }>;
        };
      };
    }>(
      `query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
          recommendations(sort: RATING_DESC, perPage: 12) {
            nodes {
              mediaRecommendation {
                id
                idMal
                title { romaji english userPreferred }
                coverImage { large extraLarge }
                episodes
              }
            }
          }
        }
      }`,
      { idMal: malId }
    );
    const items: AnimeListDto[] = [];
    for (const node of data.Media?.recommendations?.nodes ?? []) {
      const r = node.mediaRecommendation;
      if (!r) continue;
      items.push({
        mal_id: r.idMal || r.id,
        title: r.title?.english || r.title?.romaji || r.title?.userPreferred || `Anime ${r.id}`,
        title_english: r.title?.english ?? null,
        image_url: r.coverImage?.extraLarge ?? r.coverImage?.large ?? null,
        episodes: r.episodes ?? null,
      });
    }
    return dedupeAnimeListByMalId(items).slice(0, 12);
  } catch {
    return [];
  }
}

export async function getAnimeByMalId(
  malId: number
): Promise<AnimeDetailDto | null> {
  if (!Number.isFinite(malId) || malId <= 0) return null;

  try {
    const res = await fetchJikanWithTimeout(`${JIKAN_BASE}/anime/${malId}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const json = (await res.json()) as JikanSingleResponse;
      if (json.data) {
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
    }
  } catch {
    // Jikan failed — fall back to AniList
  }

  try {
    const data = await anilistGraphql<{
      Media?: {
        id: number;
        idMal?: number | null;
        title: { romaji?: string | null; english?: string | null; userPreferred?: string | null };
        coverImage?: { large?: string | null; extraLarge?: string | null } | null;
        episodes?: number | null;
        description?: string | null;
        status?: string | null;
        format?: string | null;
        startDate?: { year?: number | null; month?: number | null; day?: number | null } | null;
        duration?: number | null;
        averageScore?: number | null;
        genres?: string[] | null;
      };
    }>(
      `query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
          id
          idMal
          title { romaji english userPreferred }
          coverImage { large extraLarge }
          episodes
          description(asHtml: false)
          status
          format
          startDate { year month day }
          duration
          averageScore
          genres
        }
      }`,
      { idMal: malId }
    );
    const m = data.Media;
    if (!m) return null;
    const statusMap: Record<string, string> = {
      FINISHED: "Finished Airing",
      RELEASING: "Currently Airing",
      NOT_YET_RELEASED: "Not yet aired",
      CANCELLED: "Cancelled",
      HIATUS: "On Hiatus",
    };
    const airedDate = m.startDate?.year
      ? `${m.startDate.year}${m.startDate.month ? `-${String(m.startDate.month).padStart(2, "0")}` : ""}`
      : null;
    return {
      mal_id: m.idMal || m.id,
      title: m.title.english || m.title.romaji || m.title.userPreferred || `Anime ${malId}`,
      title_english: m.title.english ?? null,
      image_url: m.coverImage?.extraLarge ?? m.coverImage?.large ?? null,
      episodes: m.episodes ?? null,
      synopsis: stripHtml(m.description),
      url: `https://myanimelist.net/anime/${malId}`,
      status: statusMap[m.status ?? ""] ?? m.status ?? null,
      media_type: m.format ?? "TV",
      aired: airedDate,
      duration: m.duration ? `${m.duration} min` : null,
      rating: null,
      score: m.averageScore ? Number((m.averageScore / 10).toFixed(1)) : null,
      genres: m.genres ?? [],
    };
  } catch {
    return null;
  }
}
