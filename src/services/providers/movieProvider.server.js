/**
 * Movie metadata provider adapter — wired for TMDb (The Movie Database).
 *
 * This file is written to run on a server/serverless function, NOT in the
 * React bundle — the whole point of a key pool is that the keys never reach
 * the browser. Wire this behind your own endpoint, e.g.
 * GET /api/v1/movies -> calls searchMovies() -> returns normalized JSON.
 *
 * Auth: TMDb's v4 Read Access Token (the long eyJ... string from
 * themoviedb.org/settings/api) goes straight into an Authorization: Bearer
 * header — no query-string key needed.
 */
import { ApiKeyPool, fetchWithKeyPool } from "../apiKeyPool.js";

// One TMDb v4 Read Access Token per env var: MTBP_API_KEY_1, MTBP_API_KEY_2, ...
// Each token can come from a different TMDb account, so the pool spreads
// requests across several independent quota buckets.
const MOVIE_PROVIDER_BASE_URL = process.env.MTBP_BASE_URL || "https://api.themoviedb.org/3";
const POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280";

const movieKeyPool = new ApiKeyPool(
  Object.keys(process.env)
    .filter((k) => k.startsWith("MTBP_API_KEY_"))
    .map((k) => process.env[k]),
  { cooldownMs: 60_000 }
);

// TMDb's search/list endpoints only return numeric genre_ids, not names —
// this small cache fetches the id->name map once (it barely ever changes)
// so normalizeMovieList can attach real genre names without a second round
// trip per movie.
let genreMapCache = null;
async function getGenreMap() {
  if (genreMapCache) return genreMapCache;
  const res = await fetchWithKeyPool(movieKeyPool, (key) => ({
    url: `${MOVIE_PROVIDER_BASE_URL}/genre/movie/list?language=en`,
    init: { headers: { Authorization: `Bearer ${key}`, accept: "application/json" } },
  }));
  const data = await res.json();
  genreMapCache = Object.fromEntries((data.genres ?? []).map((g) => [g.id, g.name]));
  return genreMapCache;
}

export async function searchMovies(query, { page = 1 } = {}) {
  const [res, genreMap] = await Promise.all([
    fetchWithKeyPool(movieKeyPool, (key) => ({
      url: `${MOVIE_PROVIDER_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
      init: { headers: { Authorization: `Bearer ${key}`, accept: "application/json" } },
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
      url: `${MOVIE_PROVIDER_BASE_URL}/movie/popular?page=${page}`,
      init: { headers: { Authorization: `Bearer ${key}`, accept: "application/json" } },
    })),
    getGenreMap(),
  ]);
  const data = await res.json();
  return normalizeMovieList(data, genreMap);
}

export async function getMovieById(id) {
  const res = await fetchWithKeyPool(movieKeyPool, (key) => ({
    url: `${MOVIE_PROVIDER_BASE_URL}/movie/${encodeURIComponent(id)}?append_to_response=credits`,
    init: { headers: { Authorization: `Bearer ${key}`, accept: "application/json" } },
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
    // TMDb only provides metadata, not streaming rights — these two flags
    // must come from your own licensing/catalog layer, never invented here.
    streamAuthorized: Boolean(m.aurevo_stream_authorized),
    downloadAuthorized: Boolean(m.aurevo_download_authorized),
    source: "tmdb",
  };
}

export const _internal = { movieKeyPool, getGenreMap };
