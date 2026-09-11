import { useState, useEffect, useCallback } from "react";
import { MovieCard, MusicCard, VideoCard } from "../components/cards/Cards.jsx";
import { searchMovies, searchMusicVideos } from "../services/api.js";
import "./Search.css";

const TABS = [
  { id: "all", label: "All" },
  { id: "movies", label: "Movies" },
  { id: "music", label: "Music" },
  { id: "videos", label: "Music Videos" },
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [results, setResults] = useState({ movies: [], music: [], videos: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ movies: [], music: [], videos: [] });
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      await performSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const [movieResults, musicResults] = await Promise.all([
        searchMovies(searchQuery).catch(() => []),
        searchMusicVideos(searchQuery).catch(() => []),
      ]);

      setResults({
        movies: movieResults || [],
        music: musicResults || [],
        videos: musicResults?.filter(v => v.type === "video") || [],
      });
    } catch (err) {
      console.error("Search error:", err);
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const showMovies = activeTab === "all" || activeTab === "movies";
  const showMusic = activeTab === "all" || activeTab === "music";
  const showVideos = activeTab === "all" || activeTab === "videos";

  const hasResults = results.movies.length > 0 || results.music.length > 0 || results.videos.length > 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Search</h1>
          <p>Find movies, music, and music videos across Aurevo.</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search movies, artists, songs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery("")} aria-label="Clear search">
              ×
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="search-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`search-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="search-loading">
          <div className="loading-spinner" />
          <p>Searching...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="search-error">
          <p>{error}</p>
          <button onClick={() => performSearch(query)}>Try Again</button>
        </div>
      )}

      {/* Results */}
      {!loading && !error && hasSearched && (
        <>
          {hasResults ? (
            <>
              {showMovies && results.movies.length > 0 && (
                <>
                  <h2 className="section-title">Movies ({results.movies.length})</h2>
                  <div className="rail">
                    {results.movies.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                  </div>
                </>
              )}

              {showMusic && results.music.length > 0 && (
                <>
                  <h2 className="section-title">Music ({results.music.length})</h2>
                  <div className="rail">
                    {results.music.map((track) => (
                      <MusicCard key={track.id} track={track} />
                    ))}
                  </div>
                </>
              )}

              {showVideos && results.videos.length > 0 && (
                <>
                  <h2 className="section-title">Music Videos ({results.videos.length})</h2>
                  <div className="rail">
                    {results.videos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="no-results">
              <p>No results found for "{query}"</p>
              <p className="no-results-hint">Try different keywords or check spelling</p>
            </div>
          )}
        </>
      )}

      {/* Initial State - Show trending when no search */}
      {!hasSearched && !loading && (
        <div className="search-initial">
          <p>Start typing to search across movies, music, and videos.</p>
        </div>
      )}
    </div>
  );
}
