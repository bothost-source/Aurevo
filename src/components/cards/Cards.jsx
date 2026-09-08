import DownloadButton from "../common/DownloadButton.jsx";
import "./Cards.css";

const GRADIENTS = [
  "linear-gradient(160deg,#2a2f6b,#0a0e14)",
  "linear-gradient(160deg,#5c2a4a,#0a0e14)",
  "linear-gradient(160deg,#1f5c52,#0a0e14)",
  "linear-gradient(160deg,#5c3f1f,#0a0e14)",
];

function gradientFor(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % GRADIENTS.length;
  return GRADIENTS[h];
}

export function MovieCard({ movie }) {
  return (
    <div className="content-card">
      <div className="content-card__art" style={{ background: gradientFor(movie.id) }}>
        <span>{movie.title}</span>
        <div className="content-card__actions">
          <DownloadButton
            label={movie.title}
            size={36}
            onStart={(onProgress) => simulateDownload(onProgress)}
          />
        </div>
      </div>
      <div className="content-card__meta">
        <strong>{movie.title}</strong>
        <span>{[movie.releaseDate?.slice(0, 4), ...(movie.genres || [])].filter(Boolean).join(" · ") || "Details coming soon"}</span>
      </div>
    </div>
  );
}

export function MusicCard({ track }) {
  return (
    <div className="content-card content-card--square">
      <div className="content-card__art" style={{ background: gradientFor(track.id) }}>
        <span>{track.title}</span>
        <div className="content-card__actions">
          <DownloadButton label={track.title} size={36} onStart={(onProgress) => simulateDownload(onProgress)} />
        </div>
      </div>
      <div className="content-card__meta">
        <strong>{track.title}</strong>
        <span>{track.artist}</span>
      </div>
    </div>
  );
}

export function VideoCard({ video }) {
  return (
    <div className="content-card content-card--wide">
      <div className="content-card__art" style={{ background: gradientFor(video.id) }}>
        <span>{video.title}</span>
      </div>
      <div className="content-card__meta">
        <strong>{video.title}</strong>
        <span>{video.channelTitle}</span>
      </div>
    </div>
  );
}

/** Placeholder progress driver — swap for a real download/blob progress event
 *  from your CDN or Firebase Storage download task. */
function simulateDownload(onProgress) {
  return new Promise((resolve) => {
    let p = 0;
    const t = setInterval(() => {
      p += 0.08 + Math.random() * 0.08;
      onProgress(Math.min(p, 1));
      if (p >= 1) {
        clearInterval(t);
        resolve();
      }
    }, 180);
  });
}
