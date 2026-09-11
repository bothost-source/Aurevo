import { useState } from "react";
import "./MovieCarousel.css";

/**
 * A glassy, perspective carousel for a "Featured" rail: one large card
 * front-and-center, neighbors receding to either side with reduced scale,
 * blur and opacity. Click a side card to bring it to center; the center
 * card carries a "Watch trailer" action and a mini transport bar.
 * 
 * Updated: Uses real movie posters/backdrops from TMDB
 */
export default function MovieCarousel({ items = [], onPlayTrailer }) {
  const [index, setIndex] = useState(Math.min(1, items.length - 1));
  const [imageLoaded, setImageLoaded] = useState({});
  
  if (items.length === 0) return null;

  const go = (i) => setIndex((i + items.length) % items.length);

  const handleImageLoad = (id) => {
    setImageLoaded(prev => ({ ...prev, [id]: true }));
  };

  const handleImageError = (id) => {
    setImageLoaded(prev => ({ ...prev, [id]: 'error' }));
  };

  return (
    <div className="carousel">
      <div className="carousel__stage">
        {items.map((item, i) => {
          const offset = i - index;
          const abs = Math.abs(offset);
          if (abs > 2) return null; // keep the DOM light
          
          const hasImage = item.backdropUrl || item.posterUrl;
          const isImageLoaded = imageLoaded[item.id] === true;
          const isImageError = imageLoaded[item.id] === 'error';
          
          return (
            <button
              key={item.id}
              className={`carousel__card${offset === 0 ? " is-center" : ""}`}
              style={{ "--offset": offset, "--abs-offset": abs }}
              onClick={() => (offset === 0 ? onPlayTrailer?.(item) : go(index + offset))}
              aria-label={offset === 0 ? `${item.title} — watch trailer` : `Show ${item.title}`}
            >
              <div className="carousel__art">
                {/* Real movie backdrop image */}
                {hasImage && !isImageError && (
                  <img
                    src={item.backdropUrl || item.posterUrl}
                    alt={item.title}
                    className={`carousel__image ${isImageLoaded ? 'loaded' : ''}`}
                    onLoad={() => handleImageLoad(item.id)}
                    onError={() => handleImageError(item.id)}
                  />
                )}
                
                {/* Loading skeleton */}
                {hasImage && !isImageLoaded && !isImageError && (
                  <div className="carousel__skeleton" />
                )}
                
                {/* Fallback gradient if no image */}
                {(!hasImage || isImageError) && (
                  <div 
                    className="carousel__fallback" 
                    style={{ background: item.gradient || 'linear-gradient(160deg,#3a2a6b,#0a0e14)' }}
                  >
                    <span className="carousel__art-title">{item.title}</span>
                  </div>
                )}
                
                {/* Gradient overlay for text readability */}
                {isImageLoaded && (
                  <div className="carousel__overlay" />
                )}
              </div>
              
              {offset === 0 && (
                <div className="carousel__meta">
                  <span className="carousel__watch">▶ Watch trailer</span>
                  <div className="carousel__row">
                    <strong>{item.title}</strong>
                  </div>
                  <div className="carousel__sub">
                    {item.releaseDate?.split('-')[0] || item.year} · 
                    {item.genres?.slice(0, 2).join(', ') || item.genre} · 
                    ★ {item.rating}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="carousel__transport glass">
        <button aria-label="Previous" onClick={() => go(index - 1)}>⏮</button>
        <button 
          aria-label="Play" 
          className="carousel__play"
          onClick={() => onPlayTrailer?.(items[index])}
        >
          ▶
        </button>
        <button aria-label="Next" onClick={() => go(index + 1)}>⏭</button>
        <div className="carousel__now">
          <strong>{items[index].title}</strong>
          <span>{items[index].genres?.[0] || items[index].genre}</span>
        </div>
      </div>
    </div>
  );
}
