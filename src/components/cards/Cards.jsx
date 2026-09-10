import { useState } from "react";
import DownloadButton from "../DownloadButton.jsx";
import "./Cards.css";

export function MovieCard({ movie, onPlay }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handlePlay = () => {
    if (onPlay) {
      onPlay(movie);
    } else {
      // Default: open trailer or detail modal
      console.log("Play movie:", movie);
    }
  };

  const handleDownload = () => {
    // In real app, fetch download URL from backend
    return fetch(`/api/v1/movies/${movie.id}/download`)
      .then(res => res.json())
      .then(data => data.downloadUrl);
  };

  return (
    <div className="movie-card" onClick={handlePlay}>
      <div className="movie-card__poster-container">
        {!imageLoaded && !imageError && (
          <div className="movie-card__skeleton" />
        )}
        
        {imageError ? (
          <div className="movie-card__placeholder">
            <span>{movie.title?.charAt(0)}</span>
          </div>
        ) : (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className={`movie-card__poster ${imageLoaded ? 'loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}
        
        <div className="movie-card__overlay">
          <button className="movie-card__play-btn" aria-label="Play">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          
          <div className="movie-card__download">
            <DownloadButton
              fileUrl={movie.downloadUrl}
              fileName={`${movie.title}.mp4`}
              compact
            />
          </div>
        </div>

        {movie.rating && (
          <div className="movie-card__rating">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            {movie.rating}
          </div>
        )}
      </div>

      <div className="movie-card__info">
        <h3 className="movie-card__title">{movie.title}</h3>
        <p className="movie-card__meta">
          {movie.releaseDate?.split('-')[0]} • {movie.genres?.slice(0, 2).join(', ')}
        </p>
      </div>
    </div>
  );
}

export function MusicCard({ track, onPlay }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (onPlay) {
      onPlay(track, !isPlaying);
    }
  };

  return (
    <div className="music-card" onClick={handlePlay}>
      <div className="music-card__cover-container">
        {!imageLoaded && !imageError && (
          <div className="music-card__skeleton" />
        )}
        
        {imageError ? (
          <div className="music-card__placeholder">
            <span>{track.title?.charAt(0)}</span>
          </div>
        ) : (
          <img
            src={track.thumbnailUrl || track.coverUrl}
            alt={track.title}
            className={`music-card__cover ${imageLoaded ? 'loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        )}

        <div className="music-card__overlay">
          <button className={`music-card__play-btn ${isPlaying ? 'playing' : ''}`}>
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {track.duration && (
          <div className="music-card__duration">
            {formatDuration(track.duration)}
          </div>
        )}
      </div>

      <div className="music-card__info">
        <h3 className="music-card__title">{track.title}</h3>
        <p className="music-card__artist">{track.artist || track.channelTitle}</p>
      </div>
    </div>
  );
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
