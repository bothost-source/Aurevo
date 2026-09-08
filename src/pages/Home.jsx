import { useState } from "react";
import MovieCarousel from "../components/cards/MovieCarousel.jsx";
import { MovieCard, MusicCard } from "../components/cards/Cards.jsx";
import { mockMovies, mockAlbums } from "../services/mockData.js";

const FEATURED = [
  { id: "f1", title: "The Long Signal", year: 2026, genre: "Sci-Fi", rating: "8.4", gradient: "linear-gradient(160deg,#3a2a6b,#0a0e14)" },
  { id: "f2", title: "Harbor Lights", year: 2025, genre: "Drama", rating: "7.9", gradient: "linear-gradient(160deg,#6b2a3a,#0a0e14)" },
  { id: "f3", title: "Redline", year: 2026, genre: "Action", rating: "8.1", gradient: "linear-gradient(160deg,#2a6b57,#0a0e14)" },
  { id: "f4", title: "Paper Moons", year: 2024, genre: "Romance", rating: "7.5", gradient: "linear-gradient(160deg,#6b5a2a,#0a0e14)" },
  { id: "f5", title: "Static Bloom", year: 2026, genre: "Thriller", rating: "8.6", gradient: "linear-gradient(160deg,#2a3a6b,#0a0e14)" },
];

export default function Home() {
  const [trailer, setTrailer] = useState(null);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Welcome back</h1>
          <p>Pick up a film, queue up an album, or catch the newest music videos.</p>
        </div>
      </div>

      <MovieCarousel items={FEATURED} onPlayTrailer={setTrailer} />
      {trailer && (
        <p className="helper-text" style={{ textAlign: "center" }}>
          Wire this up to your licensed trailer source for “{trailer.title}.”
        </p>
      )}

      <h2 className="section-title">Continue watching</h2>
      <div className="rail">
        {mockMovies.slice(0, 6).map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>

      <h2 className="section-title">Fresh on Aurevo</h2>
      <div className="rail">
        {mockAlbums.slice(0, 6).map((t) => <MusicCard key={t.id} track={t} />)}
      </div>
    </div>
  );
}
