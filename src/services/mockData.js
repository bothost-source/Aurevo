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

export const mockPaymentHistory = [
  { id: "txn_1", date: "2026-08-07", amount: "4.80", currency: "USD", status: "confirmed", plan: "1 Month" },
  { id: "txn_2", date: "2026-07-07", amount: "4.80", currency: "USD", status: "confirmed", plan: "1 Month" },
  { id: "txn_3", date: "2026-06-07", amount: "3.00", currency: "USD", status: "failed", plan: "2 Weeks" },
];

export const plans = [
  { id: "week", label: "1 Week", price: "$1.00", billing: "Weekly" },
  { id: "biweek", label: "2 Weeks", price: "$3.00", billing: "Every 2 weeks" },
  { id: "month", label: "1 Month", price: "$4.80", billing: "Monthly" },
];
