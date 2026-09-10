import { useLocation } from "react-router-dom";
import GlassNavigation from "./components/layout/GlassNavigation.jsx";
import BottomNav from "./components/BottomNav.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

const NO_NAV_ROUTES = ["/sign-in", "/sign-up"];

export default function App() {
  const location = useLocation();
  const showNav = !NO_NAV_ROUTES.includes(location.pathname);

  return (
    <AuthProvider>
      <div className="app-shell">
        <AppRoutes />
        {showNav && <GlassNavigation />}
        {showNav && <BottomNav />}
      </div>
    </AuthProvider>
  );
}
