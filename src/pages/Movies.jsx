import { useState, useEffect } from "react";
import { MovieCard } from "../components/cards/Cards.jsx";
import { getPopularMovies, searchMovies } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import DownloadButton from "../components/DownloadButton.jsx";
import { API_BASE_URL } from "../services/config.js";

export default function Movies() {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const isFree = !user;

  useEffect(() => {
    loadMovies();
  }, [page]);

  async function loadMovies() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPopularMovies({ page });
      setMovies(data || []);
    } catch (err) {
      console.error("Failed to load movies:", err);
      setError("Failed to load movies. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      loadMovies();
      return;
    }

    setLoading(true);
    setIsSearching(true);
    try {
      const data = await searchMovies(searchQuery, { page: 1 });
      setMovies(data || []);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenMovie(movie) {
    setSelectedMovie(movie);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/movies/${movie.id}`);
      if (!res.ok) throw new Error("Could not load movie details.");
      const detail = await res.json();
      setSelectedMovie(detail);
    } catch (err) {
      console.error("Failed to load movie detail:", err);
      setDetailError("Could not load full details for this title.");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeModal() {
    setSelectedMovie(null);
    setDetailError(null);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Movies</h1>
          <p>{isFree ? "Free tier: standard quality. Upgrade for HD/4K." : "Full-quality streaming, unlimited access."}</p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="movies-search">
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              type="button" 
              className="clear-btn" 
              onClick={() => {
                setSearchQuery("");
                setIsSearching(false);
                loadMovies();
              }}
            >
              ×
            </button>
          )}
        </div>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading movies...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={loadMovies} className="btn btn-primary">Try Again</button>
        </div>
      )}

      {/* Movies Grid */}
      {!loading && !error && (
        <>
          <div className="grid">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onPlay={handleOpenMovie} />
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-ghost"
            >
              Previous
            </button>
            <span className="page-info">Page {page}</span>
            <button 
              onClick={() => setPage(p => p + 1)}
              className="btn btn-ghost"
            >
              Next
            </button>
          </div>
        </>
      )}

      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          loading={detailLoading}
          error={detailError}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function MovieDetailModal({ movie, loading, error, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "flex-end", zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          width: "100%", maxHeight: "90vh", overflowY: "auto",
          borderRadius: "16px 16px 0 0", position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 12, right: 12, zIndex: 2,
            width: 36, height: 36, borderRadius: "50%", border: "none",
            background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 20, cursor: "pointer",
          }}
        >
          ×
        </button>

        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ink-500)" }}>
              Loading…
            </div>
          ) : movie.trailerKey ? (
            <iframe
              src={`https://www.youtube.com/embed/${movie.trailerKey}?rel=0`}
              title={`${movie.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <>
              {movie.backdropUrl && (
                <img
                  src={movie.backdropUrl}
                  alt=""
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }}
                />
              )}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-300)", textAlign: "center", padding: 20 }}>
                Trailer not available for this title yet.
              </div>
            </>
          )}
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <h2 style={{ margin: 0, color: "var(--ink-000)" }}>{movie.title}</h2>
            <div style={{ flexShrink: 0 }}>
              <DownloadButton fileUrl={movie.downloadUrl} fileName={`${movie.title}.mp4`} compact />
            </div>
          </div>

          <p style={{ color: "var(--ink-500)", fontSize: "0.85rem", margin: "6px 0 12px" }}>
            {movie.releaseDate?.split("-")[0]}
            {movie.rating ? ` • Rating: ${movie.rating}/10` : ""}
            {movie.genres?.length ? ` • ${movie.genres.join(", ")}` : ""}
          </p>

          {error && <p className="error-text">{error}</p>}

          {movie.synopsis && (
            <p style={{ color: "var(--ink-300)", fontSize: "0.9rem", lineHeight: 1.5 }}>{movie.synopsis}</p>
          )}
        </div>
      </div>
    </div>
  );
}
