import { useState } from "react";
import { MovieCard, MusicCard, VideoCard } from "../components/cards/Cards.jsx";
import { mockMovies, mockAlbums, mockMusicVideos } from "../services/mockData.js";

export default function Search() {
  const [query, setQuery] = useState("");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Search</h1>
          <p>One field, everything Aurevo has — movies, music and music videos.</p>
        </div>
      </div>

      <div className="field" style={{ maxWidth: 480 }}>
        <input
          placeholder="Search movies, artists, songs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <h2 className="section-title">Movies</h2>
      <div className="rail">{mockMovies.slice(0, 5).map((m) => <MovieCard key={m.id} movie={m} />)}</div>

      <h2 className="section-title">Music</h2>
      <div className="rail">{mockAlbums.slice(0, 5).map((t) => <MusicCard key={t.id} track={t} />)}</div>

      <h2 className="section-title">Music videos</h2>
      <div className="rail">{mockMusicVideos.slice(0, 5).map((v) => <VideoCard key={v.id} video={v} />)}</div>
    </div>
  );
}
