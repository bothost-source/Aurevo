import { MovieCard } from "../components/cards/Cards.jsx";
import { mockMovies } from "../services/mockData.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Movies() {
  const { user } = useAuth();
  const isFree = !user; // replace with real subscription-tier check
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Movies</h1>
          <p>{isFree ? "Free tier: 2 searches a day, standard quality. Upgrade any time." : "Full-quality streaming, unlimited search."}</p>
        </div>
      </div>
      <div className="grid">
        {mockMovies.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </div>
  );
}
