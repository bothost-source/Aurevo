import { MusicCard } from "../components/cards/Cards.jsx";
import { mockAlbums } from "../services/mockData.js";

export default function Music() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Music</h1>
          <p>Albums and singles, ready to stream or take offline.</p>
        </div>
      </div>
      <div className="grid">
        {mockAlbums.map((t) => <MusicCard key={t.id} track={t} />)}
      </div>
    </div>
  );
}
