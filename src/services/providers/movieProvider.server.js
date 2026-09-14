
import { ApiKeyPool, fetchWithKeyPool } from "../apiKeyPool.js";

const MOVIE_PROVIDER_BASE_URL = process.env.MTBP_BASE_URL || "https://api.themoviedb.org/3";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";

const movieKeyPool = new ApiKeyPool(
  Object.keys(process.env)
    .filter((k) => k.startsWith("MTBP_API_KEY_"))
    .map((k) => process.env[k]),
  { cooldownMs: 60_000 }
);

function withApiKey(url, key) {
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}api_key=${encodeURIComponent(key)}`;
}

let genreMapCache = null;
async function getGenreMap() {
  if (genreMapCache) return genreMapCache;
  const res = await fetchWithKeyPool(movieKeyPool, (key) => ({
    url: withApiKey(`${MOVIE_PROVIDER_BASE_URL}/genre/movie/list?language=en`, key),
    init: { headers: { accept: "application/json" } },
  }));
  const data = await res.json();
  genreMapCache = Object.fromEntries((data.genres ?? []).map((g) => [g.id, g.name]));
  return genreMapCache;
}

export async function searchMovies(query, { page = 1 } = {}) {
  const [res, genreMap] = await Promise.all([
    fetchWithKeyPool(movieKeyPool, (key) => ({
      url: withApiKey(
        `${MOVIE_PROVIDER_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
        key
      ),
      init: { headers: { accept: "application/json" } },
    })),
    getGenreMap(),
  ]);
  const data = await res.json();
  return normalizeMovieList(data, genreMap);
}

/** TMDb's "what's popular right now" — good for a Home rail. */
export async function getPopularMovies({ page = 1 } = {}) {
  const [res, genreMap] = await Promise.all([
    fetchWithKeyPool(movieKeyPool, (key) => ({
      url: withApiKey(`${MOVIE_PROVIDER_BASE_URL}/movie/popular?page=${page}`, key),
      init: { headers: { accept: "application/json" } },
    })),
    getGenreMap(),
  ]);
  const data = await res.json();
  return normalizeMovieList(data, genreMap);
}

export async function getMovieById(id) {
 
  const res = await fetchWithKeyPool(movieKeyPool, (key) => ({
    url: withApiKey(`${MOVIE_PROVIDER_BASE_URL}/movie/${encodeURIComponent(id)}?append_to_response=credits,videos`, key),
    init: { headers: { accept: "application/json" } },
  }));
  const data = await res.json();
  return normalizeMovieDetail(data);
}

function normalizeMovieList(raw, genreMap) {
  const results = raw?.results ?? [];
  return results.map((m) => ({
    id: m.id,
    title: m.title,
    posterUrl: m.poster_path ? `${POSTER_BASE_URL}${m.poster_path}` : null,
    backdropUrl: m.backdrop_path ? `${BACKDROP_BASE_URL}${m.backdrop_path}` : null,
    releaseDate: m.release_date || null,
    genres: (m.genre_ids ?? []).map((id) => genreMap[id]).filter(Boolean),
    rating: typeof m.vote_average === "number" ? Number(m.vote_average.toFixed(1)) : null,
    synopsis: m.overview || null,
    source: "tmdb",
  }));
}

function normalizeMovieDetail(m) {
  // Prefer an official YouTube trailer; fall back to any YouTube trailer,
  // then any YouTube video at all, since some titles are only tagged
  // "Teaser" or "Clip" rather than "Trailer".
  const videos = m.videos?.results ?? [];
  const trailer =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    videos.find((v) => v.site === "YouTube") ||
    null;

  return {
    id: m.id,
    title: m.title,
    synopsis: m.overview || null,
    posterUrl: m.poster_path ? `${POSTER_BASE_URL}${m.poster_path}` : null,
    backdropUrl: m.backdrop_path ? `${BACKDROP_BASE_URL}${m.backdrop_path}` : null,
    releaseDate: m.release_date || null,
    runtimeMinutes: m.runtime ?? null,
    cast: (m.credits?.cast ?? []).slice(0, 10).map((c) => c.name),
    genres: (m.genres ?? []).map((g) => g.name),
    rating: typeof m.vote_average === "number" ? Number(m.vote_average.toFixed(1)) : null,
    // A real, embeddable YouTube trailer key — null if TMDb has none for
    // this title, in which case the UI should say so honestly rather than
    // show a broken player.
    trailerKey: trailer?.key || null,
    // TMDb only provides metadata, not streaming rights — these two flags
    // must come from your own licensing/catalog layer, never invented here.
    streamAuthorized: Boolean(m.aurevo_stream_authorized),
    downloadAuthorized: Boolean(m.aurevo_download_authorized),
    source: "tmdb",
  };
}

export const _internal = { movieKeyPool, getGenreMap };
