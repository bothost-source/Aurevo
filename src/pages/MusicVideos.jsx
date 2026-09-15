import { useState, useEffect } from "react";
import { MusicCard } from "../components/cards/Cards.jsx";
import { searchMusicVideos } from "../services/api.js";

export default function MusicVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [nowPlaying, setNowPlaying] = useState(null);

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
          <p>Official music videos from YouTube — plays with video here.</p>
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
            <MusicCard key={video.id} track={video} onPlay={() => setNowPlaying(video)} />
          ))}
        </div>
      )}

      {nowPlaying && (
        <VideoPlayerModal video={nowPlaying} onClose={() => setNowPlaying(null)} />
      )}
    </div>
  );
}

function VideoPlayerModal({ video, onClose }) {
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

        {/* Real, visible YouTube embed — play/pause, seek, and
            fullscreen/landscape all come from YouTube's own player. */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "#000" }}>
          {video.id ? (
            <iframe
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ink-500)" }}>
              This video isn't available to play.
            </div>
          )}
        </div>

        <div style={{ padding: 20 }}>
          <h2 style={{ margin: 0, color: "var(--ink-000)" }}>{video.title}</h2>
          <p style={{ color: "var(--ink-500)", fontSize: "0.85rem", margin: "6px 0 0" }}>
            {video.artist || video.channelTitle}
          </p>
        </div>
      </div>
    </div>
  );
}
