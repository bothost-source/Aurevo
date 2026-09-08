import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./GlassNavigation.css";

const ICONS = {
  home: (
    <path d="M3 11.5 12 4l9 7.5M5.5 10v9h5v-5.5h3V19h5v-9" />
  ),
  movies: (
    <path d="M4 6h16v13H4z M4 6l3-3h3l-2 3 M11 6l3-3h3l-2 3" />
  ),
  music: (
    <path d="M9 18V6l11-2v12 M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3z M20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z" />
  ),
  clips: (
    <path d="M4 5h16v14H4z M9 9.5v5l4.5-2.5z" />
  ),
  search: (
    <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3" />
  ),
  you: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
  ),
};

const ITEMS = [
  { to: "/", label: "Home", icon: "home", end: true },
  { to: "/movies", label: "Movies", icon: "movies" },
  { to: "/music", label: "Music", icon: "music" },
  { to: "/music-videos", label: "Clips", icon: "clips" },
  { to: "/search", label: "Search", icon: "search" },
  { to: "/account", label: "You", icon: "you" },
];

export default function GlassNavigation() {
  const location = useLocation();
  const railRef = useRef(null);
  const itemRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeItem = ITEMS.find((it) =>
      it.end ? location.pathname === it.to : location.pathname.startsWith(it.to)
    ) ?? ITEMS[0];
    const el = itemRefs.current[activeItem.to];
    const rail = railRef.current;
    if (el && rail) {
      const railBox = rail.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      setIndicator({ left: box.left - railBox.left, width: box.width });
    }
  }, [location.pathname]);

  return (
    <nav className="aurevo-nav glass" aria-label="Primary">
      <div className="aurevo-nav__rail" ref={railRef}>
        <span
          className="aurevo-nav__glow"
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
          aria-hidden="true"
        />
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            ref={(el) => (itemRefs.current[item.to] = el)}
            className={({ isActive }) => `aurevo-nav__item${isActive ? " is-active" : ""}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true">
              {ICONS[item.icon]}
            </svg>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
