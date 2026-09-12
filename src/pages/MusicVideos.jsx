import { useState, useEffect } from "react";
import { VideoCard } from "../components/cards/Cards.jsx";
import { searchMusicVideos } from "../services/api.js";

export default function MusicVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    setLoading(true);
    try {
      const data = await searchMusicVideos("official music video");
      setVideos(data || []);
    } catch (err) {
      console.error("Failed to load videos:", err);
      setError("Failed to load music videos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadVideos();
      return;
    }

    setLoading(true);
    try {
      const data = await searchMusicVideos(searchQuery);
      setVideos(data || []);
    } catch (err) {
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Music videos</h1>
          <p>Official music videos from YouTube.</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="videos-search">
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search music videos..."
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
          <p>Loading videos...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={loadVideos} className="btn btn-primary">Try Again</button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
