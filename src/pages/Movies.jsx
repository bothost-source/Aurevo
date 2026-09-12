import { useState, useEffect } from "react";
import { MovieCard } from "../components/cards/Cards.jsx";
import { getPopularMovies, searchMovies } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Movies() {
  const { user } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

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
              <MovieCard key={movie.id} movie={movie} />
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
    </div>
  );
}
