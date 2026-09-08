/**
 * Movie metadata provider adapter.
 *
 * This file is written to run on a server/serverless function, NOT in the
 * React bundle — the whole point of a key pool is that the keys never reach
 * the browser. Wire this behind your own endpoint, e.g.
 * GET /api/v1/movies -> calls searchMovies() -> returns normalized JSON.
 *
 * "MTBP" was the placeholder name used in the project brief for the movie
 * database provider. Confirm the exact provider (its real name, base URL,
 * and response shape) before wiring this up for real — the request builder
 * and the normalizer below are the two functions you'll need to adjust to
 * match that provider's actual API.
 */
import { ApiKeyPool, fetchWithKeyPool } from "../apiKeyPool.js";

// Populate from environment variables, one per key, e.g.
// MTBP_API_KEY_1, MTBP_API_KEY_2, MTBP_API_KEY_3 ...
// Using several keys means the pool can round-robin between them so one
// account's per-day/per-minute quota isn't the only thing standing between
// your users and a search result.
const MOVIE_PROVIDER_BASE_URL = process.env.MTBP_BASE_URL || "https://api.example-movie-provider.com/v1";

const movieKeyPool = new ApiKeyPool(
  Object.keys(process.env)
    .filter((k) => k.startsWith("MTBP_API_KEY_"))
    .map((k) => process.env[k]),
  { cooldownMs: 60_000 }
);

export async function searchMovies(query, { page = 1 } = {}) {
  const res = await fetchWithKeyPool(movieKeyPool, (key) => ({
    url: `${MOVIE_PROVIDER_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}`,
    init: { headers: { Authorization: `Bearer ${key}` } },
  }));
  const data = await res.json();
  return normalizeMovieList(data);
}

export async function getMovieById(id) {
  const res = await fetchWithKeyPool(movieKeyPool, (key) => ({
    url: `${MOVIE_PROVIDER_BASE_URL}/movie/${encodeURIComponent(id)}`,
    init: { headers: { Authorization: `Bearer ${key}` } },
  }));
  const data = await res.json();
  return normalizeMovieDetail(data);
}

/** Normalize the provider's raw response into Aurevo's internal shape.
 *  Adjust field mappings once the real provider is confirmed. */
function normalizeMovieList(raw) {
  const results = raw?.results ?? raw?.data ?? [];
  return results.map((m) => ({
    id: m.id ?? m.movie_id,
    title: m.title ?? m.name,
    posterUrl: m.poster_path ?? m.poster ?? null,
    releaseDate: m.release_date ?? null,
    genres: m.genres ?? [],
    rating: m.vote_average ?? null,
    source: "mtbp",
  }));
}

function normalizeMovieDetail(m) {
  return {
    id: m.id,
    title: m.title,
    synopsis: m.overview ?? m.synopsis ?? null,
    posterUrl: m.poster_path ?? null,
    releaseDate: m.release_date ?? null,
    cast: (m.credits?.cast ?? []).map((c) => c.name),
    genres: m.genres ?? [],
    rating: m.vote_average ?? null,
    streamAuthorized: Boolean(m.aurevo_stream_authorized), // set by your own licensing layer, never invented
    downloadAuthorized: Boolean(m.aurevo_download_authorized),
    source: "mtbp",
  };
}

export const _internal = { movieKeyPool };
