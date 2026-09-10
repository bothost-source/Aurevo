// Client-side API service - calls your backend endpoints
const API_BASE = process.env.REACT_APP_API_URL || "https://aurevo-stream.onrender.com";

async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem("firebaseToken"); // or however you store auth
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  
  return res.json();
}

// Movies
export async function getPopularMovies({ page = 1 } = {}) {
  return fetchWithAuth(`/api/v1/movies/popular?page=${page}`);
}

export async function searchMovies(query, { page = 1 } = {}) {
  return fetchWithAuth(`/api/v1/movies/search?q=${encodeURIComponent(query)}&page=${page}`);
}

export async function getMovieById(id) {
  return fetchWithAuth(`/api/v1/movies/${id}`);
}

// Music Videos
export async function searchMusicVideos(query) {
  return fetchWithAuth(`/api/v1/music-videos/search?q=${encodeURIComponent(query)}`);
}

// User Profile
export async function getUserProfile() {
  return fetchWithAuth(`/api/v1/profile`);
}

export async function saveProfile(profile) {
  return fetchWithAuth(`/api/v1/profile`, {
    method: "POST",
    body: JSON.stringify(profile),
  });
}
