import { type UniversalMediaDto } from "./media-types";

const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function getTmdbImageUrl(
  path: string | null | undefined,
  size: "w300" | "w500" | "w780" | "w1280" | "original" = "w500"
): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function getAuthHeaders(): HeadersInit {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
  return { "Content-Type": "application/json" };
}

function getApiKeyQuery(): string {
  const key = process.env.TMDB_API_KEY;
  if (key && !process.env.TMDB_ACCESS_TOKEN) {
    return `&api_key=${encodeURIComponent(key)}`;
  }
  return "";
}

/** Pre-populated curated movies in case TMDB_API_KEY is not yet configured */
const CURATED_MOVIES: UniversalMediaDto[] = [
  {
    id: "693134",
    externalId: "693134",
    provider: "tmdb",
    mediaType: "movie",
    title: "Dune: Part Two",
    originalTitle: "Dune: Part Two",
    overview:
      "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.",
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
    releaseDate: "2024-02-27",
    releaseYear: 2024,
    genres: ["Science Fiction", "Adventure"],
    airStatus: "Released",
    ratingAverage: 8.2,
    voteCount: 5200,
    runtimeMinutes: 166,
    totalEpisodes: 1,
  },
  {
    id: "872585",
    externalId: "872585",
    provider: "tmdb",
    mediaType: "movie",
    title: "Oppenheimer",
    originalTitle: "Oppenheimer",
    overview:
      "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    releaseDate: "2023-07-19",
    releaseYear: 2023,
    genres: ["Drama", "History"],
    airStatus: "Released",
    ratingAverage: 8.1,
    voteCount: 9100,
    runtimeMinutes: 181,
    totalEpisodes: 1,
  },
  {
    id: "569094",
    externalId: "569094",
    provider: "tmdb",
    mediaType: "movie",
    title: "Spider-Man: Across the Spider-Verse",
    originalTitle: "Spider-Man: Across the Spider-Verse",
    overview:
      "After reuniting with Gwen Stacy, Brooklyn's full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse.",
    posterUrl: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
    releaseDate: "2023-05-31",
    releaseYear: 2023,
    genres: ["Animation", "Action", "Adventure"],
    airStatus: "Released",
    ratingAverage: 8.4,
    voteCount: 6800,
    runtimeMinutes: 140,
    totalEpisodes: 1,
  },
  {
    id: "157336",
    externalId: "157336",
    provider: "tmdb",
    mediaType: "movie",
    title: "Interstellar",
    originalTitle: "Interstellar",
    overview:
      "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
    posterUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/rAiYTrKGqDCRIIqo664sY9XZIvQ.jpg",
    releaseDate: "2014-11-05",
    releaseYear: 2014,
    genres: ["Adventure", "Drama", "Science Fiction"],
    airStatus: "Released",
    ratingAverage: 8.4,
    voteCount: 35000,
    runtimeMinutes: 169,
    totalEpisodes: 1,
  },
  {
    id: "155",
    externalId: "155",
    provider: "tmdb",
    mediaType: "movie",
    title: "The Dark Knight",
    originalTitle: "The Dark Knight",
    overview:
      "Batman raises the stakes in his war on crime. With the help of allies Lt. Jim Gordon and DA Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    releaseDate: "2008-07-16",
    releaseYear: 2008,
    genres: ["Drama", "Action", "Crime", "Thriller"],
    airStatus: "Released",
    ratingAverage: 8.5,
    voteCount: 32500,
    runtimeMinutes: 152,
    totalEpisodes: 1,
  },
  {
    id: "27205",
    externalId: "27205",
    provider: "tmdb",
    mediaType: "movie",
    title: "Inception",
    originalTitle: "Inception",
    overview:
      "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets, is offered a chance to regain his old life.",
    posterUrl: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    releaseDate: "2010-07-15",
    releaseYear: 2010,
    genres: ["Action", "Science Fiction", "Adventure"],
    airStatus: "Released",
    ratingAverage: 8.4,
    voteCount: 36000,
    runtimeMinutes: 148,
    totalEpisodes: 1,
  },
  {
    id: "129",
    externalId: "129",
    provider: "tmdb",
    mediaType: "movie",
    title: "Spirited Away",
    originalTitle: "千と千尋の神隠し",
    overview:
      "A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.",
    posterUrl: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg",
    releaseDate: "2001-07-20",
    releaseYear: 2001,
    genres: ["Animation", "Family", "Fantasy"],
    airStatus: "Released",
    ratingAverage: 8.5,
    voteCount: 16500,
    runtimeMinutes: 125,
    totalEpisodes: 1,
  },
  {
    id: "372058",
    externalId: "372058",
    provider: "tmdb",
    mediaType: "movie",
    title: "Your Name.",
    originalTitle: "君の名は。",
    overview:
      "High schoolers Mitsuha and Taki are complete strangers living separate lives until they suddenly switch bodies, embarking on an emotional journey across time and space.",
    posterUrl: "https://image.tmdb.org/t/p/w500/vfJFJPepRKapMd5G2ro7klIRysq.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/dIWwZW7dJJ1q48MyNVGQxHaKu5z.jpg",
    releaseDate: "2016-08-26",
    releaseYear: 2016,
    genres: ["Animation", "Romance", "Drama"],
    airStatus: "Released",
    ratingAverage: 8.5,
    voteCount: 11200,
    runtimeMinutes: 106,
    totalEpisodes: 1,
  },
];

const CURATED_TV_SHOWS: UniversalMediaDto[] = [
  {
    id: "94605",
    externalId: "94605",
    provider: "tmdb",
    mediaType: "tv",
    title: "Arcane",
    originalTitle: "Arcane",
    overview:
      "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.",
    posterUrl: "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/2meX1nMdScFOoV4370rqHWFDxoo.jpg",
    releaseDate: "2021-11-06",
    releaseYear: 2021,
    genres: ["Animation", "Sci-Fi & Fantasy", "Action & Adventure"],
    airStatus: "Ended",
    ratingAverage: 8.7,
    voteCount: 4200,
    runtimeMinutes: 40,
    totalEpisodes: 18,
    totalSeasons: 2,
  },
  {
    id: "93405",
    externalId: "93405",
    provider: "tmdb",
    mediaType: "tv",
    title: "Squid Game",
    originalTitle: "오징어 게임",
    overview:
      "Hundreds of cash-strapped players accept a strange invitation to compete in children's games. Inside, a tempting prize awaits with deadly high stakes.",
    posterUrl: "https://image.tmdb.org/t/p/w500/dDlG1v7z37ZfB2dplq307n65d8.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/oaGvjB0DvdurWhf9QIuoHgKG4i6.jpg",
    releaseDate: "2021-09-17",
    releaseYear: 2021,
    genres: ["Action & Adventure", "Mystery", "Drama"],
    airStatus: "Returning Series",
    ratingAverage: 7.8,
    voteCount: 14000,
    runtimeMinutes: 55,
    totalEpisodes: 15,
    totalSeasons: 2,
  },
  {
    id: "126308",
    externalId: "126308",
    provider: "tmdb",
    mediaType: "web_series",
    title: "Shōgun",
    originalTitle: "Shōgun",
    overview:
      "When a mysterious European ship is found marooned in a nearby fishing village, Lord Yoshii Toranaga discovers secrets that could tip the scales of power.",
    posterUrl: "https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WNzG1AgYT.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/original/c5y0rB8zPz4r1Y0rQ4L7n1l9K9r.jpg",
    releaseDate: "2024-02-27",
    releaseYear: 2024,
    genres: ["Drama", "War & Politics"],
    airStatus: "Returning Series",
    ratingAverage: 8.5,
    voteCount: 1300,
    runtimeMinutes: 60,
    totalEpisodes: 10,
    totalSeasons: 1,
  },
];

interface RawTmdbMovie {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
  status?: string;
}

interface RawTmdbTv {
  id: number;
  name: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  number_of_episodes?: number;
  number_of_seasons?: number;
  episode_run_time?: number[];
  genres?: Array<{ id: number; name: string }>;
  status?: string;
}

function mapRawMovieToUniversal(movie: RawTmdbMovie): UniversalMediaDto {
  const year = movie.release_date ? parseInt(movie.release_date.slice(0, 4), 10) : null;
  return {
    id: movie.id,
    externalId: String(movie.id),
    provider: "tmdb",
    mediaType: "movie",
    title: movie.title,
    originalTitle: movie.original_title,
    overview: movie.overview,
    posterUrl: movie.poster_path ? getTmdbImageUrl(movie.poster_path, "w500") : null,
    backdropUrl: movie.backdrop_path ? getTmdbImageUrl(movie.backdrop_path, "original") : null,
    releaseDate: movie.release_date,
    releaseYear: Number.isNaN(year) ? null : year,
    genres: (movie.genres ?? []).map((g) => g.name),
    airStatus: movie.status ?? "Released",
    ratingAverage: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null,
    voteCount: movie.vote_count ?? 0,
    runtimeMinutes: movie.runtime ?? 110,
    totalEpisodes: 1,
    totalSeasons: 1,
  };
}

function mapRawTvToUniversal(tv: RawTmdbTv, isWebSeries = false): UniversalMediaDto {
  const year = tv.first_air_date ? parseInt(tv.first_air_date.slice(0, 4), 10) : null;
  const runtime =
    tv.episode_run_time && tv.episode_run_time.length > 0
      ? tv.episode_run_time[0]
      : 45;

  return {
    id: tv.id,
    externalId: String(tv.id),
    provider: "tmdb",
    mediaType: isWebSeries ? "web_series" : "tv",
    title: tv.name,
    originalTitle: tv.original_name,
    overview: tv.overview,
    posterUrl: tv.poster_path ? getTmdbImageUrl(tv.poster_path, "w500") : null,
    backdropUrl: tv.backdrop_path ? getTmdbImageUrl(tv.backdrop_path, "original") : null,
    releaseDate: tv.first_air_date,
    releaseYear: Number.isNaN(year) ? null : year,
    genres: (tv.genres ?? []).map((g) => g.name),
    airStatus: tv.status ?? "Ended",
    ratingAverage: tv.vote_average ? Math.round(tv.vote_average * 10) / 10 : null,
    voteCount: tv.vote_count ?? 0,
    runtimeMinutes: runtime,
    totalEpisodes: tv.number_of_episodes ?? null,
    totalSeasons: tv.number_of_seasons ?? null,
  };
}

/** Fetch trending movies from TMDB or return curated fallback */
export async function getTrendingMovies(timeWindow: "day" | "week" = "week"): Promise<UniversalMediaDto[]> {
  const apiKeyQuery = getApiKeyQuery();
  const hasAuth = Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);

  if (!hasAuth) {
    return CURATED_MOVIES;
  }

  try {
    const res = await fetch(
      `${TMDB_API_BASE}/trending/movie/${timeWindow}?language=en-US${apiKeyQuery}`,
      {
        headers: getAuthHeaders(),
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.warn(`TMDB API error ${res.status}: fallback to curated`);
      return CURATED_MOVIES;
    }

    const data = (await res.json()) as { results?: RawTmdbMovie[] };
    if (!data.results || data.results.length === 0) {
      return CURATED_MOVIES;
    }

    return data.results.slice(0, 20).map(mapRawMovieToUniversal);
  } catch (err) {
    console.error("TMDB fetch error:", err);
    return CURATED_MOVIES;
  }
}

/** Fetch popular movies */
export async function getPopularMovies(page = 1): Promise<UniversalMediaDto[]> {
  const apiKeyQuery = getApiKeyQuery();
  const hasAuth = Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);

  if (!hasAuth) {
    return CURATED_MOVIES;
  }

  try {
    const res = await fetch(
      `${TMDB_API_BASE}/movie/popular?language=en-US&page=${page}${apiKeyQuery}`,
      {
        headers: getAuthHeaders(),
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return CURATED_MOVIES;
    const data = (await res.json()) as { results?: RawTmdbMovie[] };
    return (data.results ?? []).slice(0, 20).map(mapRawMovieToUniversal);
  } catch {
    return CURATED_MOVIES;
  }
}

/** Fetch top rated movies */
export async function getTopRatedMovies(page = 1): Promise<UniversalMediaDto[]> {
  const apiKeyQuery = getApiKeyQuery();
  const hasAuth = Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);

  if (!hasAuth) {
    return [...CURATED_MOVIES].reverse();
  }

  try {
    const res = await fetch(
      `${TMDB_API_BASE}/movie/top_rated?language=en-US&page=${page}${apiKeyQuery}`,
      {
        headers: getAuthHeaders(),
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return CURATED_MOVIES;
    const data = (await res.json()) as { results?: RawTmdbMovie[] };
    return (data.results ?? []).slice(0, 20).map(mapRawMovieToUniversal);
  } catch {
    return CURATED_MOVIES;
  }
}

/** Fetch movie details by TMDB ID */
export async function getMovieDetails(id: number | string): Promise<UniversalMediaDto | null> {
  const apiKeyQuery = getApiKeyQuery();
  const hasAuth = Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);

  if (!hasAuth) {
    const found = CURATED_MOVIES.find((m) => String(m.id) === String(id));
    return found ?? CURATED_MOVIES[0];
  }

  try {
    const res = await fetch(
      `${TMDB_API_BASE}/movie/${id}?language=en-US${apiKeyQuery}`,
      {
        headers: getAuthHeaders(),
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      const fallback = CURATED_MOVIES.find((m) => String(m.id) === String(id));
      return fallback ?? null;
    }

    const data = (await res.json()) as RawTmdbMovie;
    return mapRawMovieToUniversal(data);
  } catch {
    return CURATED_MOVIES.find((m) => String(m.id) === String(id)) ?? null;
  }
}

/** Search movies by text */
export async function searchMovies(query: string): Promise<UniversalMediaDto[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const apiKeyQuery = getApiKeyQuery();
  const hasAuth = Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);

  if (!hasAuth) {
    const lower = trimmed.toLowerCase();
    return CURATED_MOVIES.filter(
      (m) =>
        m.title.toLowerCase().includes(lower) ||
        (m.overview && m.overview.toLowerCase().includes(lower)) ||
        m.genres.some((g) => g.toLowerCase().includes(lower))
    );
  }

  try {
    const res = await fetch(
      `${TMDB_API_BASE}/search/movie?query=${encodeURIComponent(trimmed)}&language=en-US&include_adult=false${apiKeyQuery}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) return [];
    const data = (await res.json()) as { results?: RawTmdbMovie[] };
    return (data.results ?? []).slice(0, 20).map(mapRawMovieToUniversal);
  } catch {
    return [];
  }
}

/** Get TV shows / web series */
export async function getTrendingTvShows(): Promise<UniversalMediaDto[]> {
  const apiKeyQuery = getApiKeyQuery();
  const hasAuth = Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);

  if (!hasAuth) {
    return CURATED_TV_SHOWS;
  }

  try {
    const res = await fetch(
      `${TMDB_API_BASE}/trending/tv/week?language=en-US${apiKeyQuery}`,
      {
        headers: getAuthHeaders(),
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return CURATED_TV_SHOWS;
    const data = (await res.json()) as { results?: RawTmdbTv[] };
    return (data.results ?? []).slice(0, 20).map((t) => mapRawTvToUniversal(t));
  } catch {
    return CURATED_TV_SHOWS;
  }
}

/** Search all media types across TMDB */
export async function searchMultiMedia(query: string): Promise<UniversalMediaDto[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const apiKeyQuery = getApiKeyQuery();
  const hasAuth = Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);

  if (!hasAuth) {
    const all = [...CURATED_MOVIES, ...CURATED_TV_SHOWS];
    const lower = trimmed.toLowerCase();
    return all.filter(
      (m) =>
        m.title.toLowerCase().includes(lower) ||
        m.genres.some((g) => g.toLowerCase().includes(lower))
    );
  }

  try {
    const res = await fetch(
      `${TMDB_API_BASE}/search/multi?query=${encodeURIComponent(trimmed)}&language=en-US&include_adult=false${apiKeyQuery}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: Array<(RawTmdbMovie & { media_type: string }) | (RawTmdbTv & { media_type: string })>;
    };

    return (data.results ?? [])
      .filter((r) => r.media_type === "movie" || r.media_type === "tv")
      .slice(0, 20)
      .map((r) => {
        if (r.media_type === "movie") {
          return mapRawMovieToUniversal(r as RawTmdbMovie);
        }
        return mapRawTvToUniversal(r as RawTmdbTv);
      });
  } catch {
    return [];
  }
}
