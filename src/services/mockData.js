/**
 * Placeholder content so every page renders something real-looking before
 * your server endpoints (backed by services/providers/*.server.js) are
 * wired up. Swap the fetchMovies/fetchMusic/fetchMusicVideos calls in each
 * page for real requests to your own /api/v1/... endpoints when ready.
 * No fake statistics (play counts, ratings, etc.) are included here beyond
 * what's needed to lay out the UI — replace all of it with real provider
 * data before launch, per the project's no-fake-stats rule.
 */

export const mockMovies = Array.from({ length: 10 }).map((_, i) => ({
  id: `movie-${i + 1}`,
  title: `Untitled Feature ${i + 1}`,
  posterUrl: null,
  releaseDate: null,
  genres: [],
  rating: null,
}));

export const mockAlbums = Array.from({ length: 10 }).map((_, i) => ({
  id: `music-${i + 1}`,
  title: `Untitled Track ${i + 1}`,
  artist: "Unknown Artist",
  artworkUrl: null,
}));

export const mockMusicVideos = Array.from({ length: 8 }).map((_, i) => ({
  id: `mv-${i + 1}`,
  title: `Untitled Video ${i + 1}`,
  channelTitle: "Unknown Channel",
  thumbnailUrl: null,
}));

// Real plan data now lives in ./plans.js (shared with the backend so the
// price shown always matches the price charged). Real payment history is
// fetched from your backend in paymentsClient.js — no fake rows here.
