import { VideoCard } from "../components/cards/Cards.jsx";
import { mockMusicVideos } from "../services/mockData.js";

export default function MusicVideos() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Music videos</h1>
          <p>Sourced and played through the official YouTube Player, per YouTube's API Services Terms.</p>
        </div>
      </div>
      <div className="grid">
        {mockMusicVideos.map((v) => <VideoCard key={v.id} video={v} />)}
      </div>
    </div>
  );
}
