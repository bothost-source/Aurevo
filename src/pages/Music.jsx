import { useState, useEffect, useRef } from "react";
import { MusicCard } from "../components/cards/Cards.jsx";
import { searchMusicVideos } from "../services/api.js";

// Loads the official YouTube IFrame Player API script once and resolves
// with window.YT once it's ready. This is the real, supported embed
// mechanism (not stream extraction) — it plays the actual YouTube player,
// just rendered at 1x1 so only the audio is meant to be noticed, the way
// a "listen" mode would in a normal music app.
let ytApiPromise = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

const PLAYER_ELEMENT_ID = "aurevo-audio-player";

export default function Music() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playerRef = useRef(null);

  useEffect(() => {
    loadMusic();
    // Stop playback if the user navigates away from this page entirely.
    return () => {
      playerRef.current?.stopVideo?.();
    };
  }, []);

  async function loadMusic() {
    setLoading(true);
    try {
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

  async function playTrack(track) {
    if (!track?.id) return;
    setNowPlaying(track);
    const YT = await loadYouTubeApi();

    if (!playerRef.current) {
      playerRef.current = new YT.Player(PLAYER_ELEMENT_ID, {
        height: "1",
        width: "1",
        videoId: track.id,
        playerVars: { autoplay: 1, playsinline: 1 },
        events: {
          onReady: (e) => {
            e.target.playVideo();
            setIsPlaying(true);
          },
          onStateChange: (e) => setIsPlaying(e.data === YT.PlayerState.PLAYING),
        },
      });
    } else {
      playerRef.current.loadVideoById(track.id);
      setIsPlaying(true);
    }
  }

  function togglePlayPause() {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }

  function closePlayer() {
    playerRef.current?.stopVideo?.();
    setNowPlaying(null);
    setIsPlaying(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Music</h1>
          <p>Albums, singles, and tracks — plays as audio here. Want the video? Check Music Videos.</p>
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
        <div className="grid" style={{ paddingBottom: nowPlaying ? 80 : 0 }}>
          {tracks.map((track) => (
            <MusicCard key={track.id} track={track} onPlay={() => playTrack(track)} />
          ))}
        </div>
      )}

      {/* Real YouTube player, present but visually tucked away — audio
          keeps playing normally, there's just nothing to look at. Not
          display:none, since some browsers pause fully hidden iframes. */}
      <div style={{ position: "fixed", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
        <div id={PLAYER_ELEMENT_ID} />
      </div>

      {nowPlaying && (
        <div
          className="glass"
          style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 1000,
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <img
            src={nowPlaying.thumbnailUrl || nowPlaying.coverUrl}
            alt=""
            style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "var(--ink-000)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {nowPlaying.title}
            </div>
            <div style={{ color: "var(--ink-500)", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {nowPlaying.artist || nowPlaying.channelTitle}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={togglePlayPause} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button className="btn btn-ghost" onClick={closePlayer} aria-label="Close player">×</button>
        </div>
      )}
    </div>
  );
}
