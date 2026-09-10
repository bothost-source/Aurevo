import { useState, useEffect } from "react";
import MovieCarousel from "../components/cards/MovieCarousel.jsx";
import { MovieCard, MusicCard } from "../components/cards/Cards.jsx";
import { searchMovies, getPopularMovies } from "../services/api.js";
import { searchMusicVideos } from "../services/api.js";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [musicVideos, setMusicVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trailer, setTrailer] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Fetch real movies from TMDB via your backend
        const movieData = await getPopularMovies({ page: 1 });
        setMovies(movieData.results || []);
        
        // Fetch real music videos from YouTube via your backend
        const musicData = await searchMusicVideos("trending music");
        setMusicVideos(musicData.results || []);
        
      } catch (err) {
        console.error("Failed to load content:", err);
        setError("Failed to load content. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading amazing content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Welcome back</h1>
          <p>Pick up a film, queue up an album, or catch the newest music videos.</p>
        </div>
      </div>

      {/* Featured Carousel - Real Movies */}
      <MovieCarousel 
        items={movies.slice(0, 5)} 
        onPlayTrailer={setTrailer} 
      />
      
      {trailer && (
        <div className="trailer-modal" onClick={() => setTrailer(null)}>
          <div className="trailer-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setTrailer(null)}>×</button>
            <video 
              controls 
              autoPlay 
              src={trailer.trailerUrl || trailer.streamUrl}
              poster={trailer.backdropUrl}
            />
          </div>
        </div>
      )}

      <h2 className="section-title">Trending Movies</h2>
      <div className="rail">
        {movies.slice(0, 12).map((movie) => (
          <MovieCard 
            key={movie.id} 
            movie={movie}
            onPlay={() => setTrailer(movie)}
          />
        ))}
      </div>

      <h2 className="section-title">Fresh Music Videos</h2>
      <div className="rail">
        {musicVideos.slice(0, 12).map((video) => (
          <MusicCard 
            key={video.id} 
            track={video}
            onPlay={() => window.open(video.videoUrl, '_blank')}
          />
        ))}
      </div>
    </div>
  );
}
