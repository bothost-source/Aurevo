import { Route, Routes } from "react-router-dom";
import Home from "../pages/Home.jsx";
import Movies from "../pages/Movies.jsx";
import Music from "../pages/Music.jsx";
import MusicVideos from "../pages/MusicVideos.jsx";
import Search from "../pages/Search.jsx";
import Account from "../pages/Account.jsx";
import Settings from "../pages/Settings.jsx";
import Payments from "../pages/Payments.jsx";
import ApiManagement from "../pages/ApiManagement.jsx";
import SignIn from "../pages/SignIn.jsx";
import SignUp from "../pages/SignUp.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/movies" element={<Movies />} />
      <Route path="/music" element={<Music />} />
      <Route path="/music-videos" element={<MusicVideos />} />
      <Route path="/search" element={<Search />} />
      <Route path="/account" element={<Account />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/payments" element={<Payments />} />
      <Route path="/developer" element={<ApiManagement />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
    </Routes>
  );
}
