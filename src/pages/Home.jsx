import { useState, useEffect } from "react";
import MovieCarousel from "../components/cards/MovieCarousel.jsx";
import { MovieCard, MusicCard } from "../components/cards/Cards.jsx";
import { getPopularMovies, searchMusicVideos } from "../services/api.js";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [musicVideos, setMusicVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    try {
      setLoading(true);
      setError(null);

      // Fetch real movies from TMDB via your backend
      const movieData = await getPopularMovies({ page: 1 });
      console.log("Movies loaded:", movieData);
      setMovies(movieData || []);

      // Fetch real music videos from YouTube via your backend
      const musicData = await searchMusicVideos("trending music videos 2024");
      console.log("Music loaded:", musicData);
      setMusicVideos(musicData || []);

    } catch (err) {
      console.error("Failed to load content:", err);
      setError("Failed to load content. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const handlePlayMovie = (movie) => {
    setSelectedMovie(movie);
    setPlayerOpen(true);
  };

  const handlePlayMusic = (track) => {
    // Open YouTube video in modal or new tab
    if (track.videoUrl) {
      window.open(track.videoUrl, '_blank');
    }
  };

  const closePlayer = () => {
    setPlayerOpen(false);
    setSelectedMovie(null);
  };

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
          <button onClick={loadContent} className="retry-btn">
            Try Again
          </button>
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
      {movies.length > 0 && (
        <MovieCarousel 
          items={movies.slice(0, 5)} 
          onPlayTrailer={handlePlayMovie} 
        />
      )}

      {/* Movie Player Modal */}
      {playerOpen && selectedMovie && (
        <div className="player-modal" onClick={closePlayer}>
          <div className="player-content" onClick={(e) => e.stopPropagation()}>
            <button className="player-close" onClick={closePlayer}>×</button>
            
            <div className="player-video-container">
              {selectedMovie.trailerUrl ? (
                <video 
                  controls 
                  autoPlay 
                  poster={selectedMovie.backdropUrl}
                  src={selectedMovie.trailerUrl}
                />
              ) : (
                <div className="player-placeholder">
                  <img 
                    src={selectedMovie.backdropUrl || selectedMovie.posterUrl} 
                    alt={selectedMovie.title}
                  />
                  <div className="player-overlay">
                    <p>Trailer not available for this title yet.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="player-info">
              <h2>{selectedMovie.title}</h2>
              <p className="player-meta">
                {selectedMovie.releaseDate?.split('-')[0]} • 
                Rating: {selectedMovie.rating}/10 • 
                {selectedMovie.genres?.join(', ')}
              </p>
              <p className="player-synopsis">{selectedMovie.synopsis}</p>
            </div>
          </div>
        </div>
      )}

      {/* Trending Movies */}
      <h2 className="section-title">Trending Movies</h2>
      <div className="rail">
        {movies.slice(0, 12).map((movie) => (
          <MovieCard 
            key={movie.id} 
            movie={movie}
            onPlay={() => handlePlayMovie(movie)}
          />
        ))}
      </div>

      {/* Fresh Music Videos */}
      <h2 className="section-title">Fresh Music Videos</h2>
      <div className="rail">
        {musicVideos.slice(0, 12).map((video) => (
          <MusicCard 
            key={video.id} 
            track={video}
            onPlay={() => handlePlayMusic(video)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {movies.length > 0 && (
        <div className="load-more-container">
          <button className="load-more-btn" onClick={loadContent}>
            Load More Content
          </button>
        </div>
      )}
    </div>
  );
}
