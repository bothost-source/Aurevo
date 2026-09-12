import { useState, useEffect } from "react";
import { MusicCard } from "../components/cards/Cards.jsx";
import { searchMusicVideos } from "../services/api.js";

export default function Music() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadMusic();
  }, []);

  async function loadMusic() {
    setLoading(true);
    try {
      // Fetch trending music
      const data = await searchMusicVideos("trending music 2024");
      setTracks(data || []);
    } catch (err) {
      console.error("Failed to load music:", err);
      setError("Failed to load music. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadMusic();
      return;
    }

    setLoading(true);
    try {
      const data = await searchMusicVideos(searchQuery);
      setTracks(data || []);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Music</h1>
          <p>Albums, singles, and music videos ready to stream.</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="music-search">
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search artists, songs, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading music...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={loadMusic} className="btn btn-primary">Try Again</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid">
          {tracks.map((track) => (
            <MusicCard key={track.id} track={track} />
          ))}
        </div>
      )}
    </div>
  );
}
