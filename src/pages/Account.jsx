import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Account() {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>You</h1>
            <p>Sign in to see your account, downloads and plan.</p>
          </div>
        </div>
        <Link to="/sign-in" className="btn btn-primary">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{user.username}</h1>
          <p>Country: {user.country} · Language: {user.language}</p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
        <AccountLink to="/settings" title="Settings" desc="Language, country, playback quality" />
        <AccountLink to="/payments" title="Plan & billing" desc="Manage your subscription" />
        <AccountLink to="/developer" title="Developer API" desc="Manage your Aurevo API keys" />
      </div>

      <button className="btn btn-ghost" style={{ marginTop: 28 }} onClick={signOut}>Sign out</button>
    </div>
  );
}

function AccountLink({ to, title, desc }) {
  return (
    <Link to={to} className="glass" style={{ display: "block", padding: 20, textDecoration: "none" }}>
      <strong style={{ color: "var(--ink-000)" }}>{title}</strong>
      <p style={{ color: "var(--ink-300)", fontSize: "0.85rem", margin: "6px 0 0" }}>{desc}</p>
    </Link>
  );
}
