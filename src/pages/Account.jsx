import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Account.css";

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
        <div className="account-signin-prompt">
          <Link to="/sign-in" className="btn btn-primary">Sign in</Link>
          <Link to="/sign-up" className="btn btn-ghost" style={{ marginLeft: 12 }}>Create account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{user.username || user.email}</h1>
          <p>
            {user.country && `Country: ${user.country}`}
            {user.country && user.language && " · "}
            {user.language && `Language: ${user.language}`}
          </p>
        </div>
      </div>

      {/* User Stats */}
      <div className="account-stats">
        <div className="stat-card glass">
          <span className="stat-value">0</span>
          <span className="stat-label">Movies Watched</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-value">0</span>
          <span className="stat-label">Songs Played</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-value">0</span>
          <span className="stat-label">Downloads</span>
        </div>
      </div>

      {/* Quick Links */}
      <h2 className="section-title">Quick Access</h2>
      <div className="account-links">
        <AccountLink to="/settings" title="Settings" desc="Language, country, playback quality" icon="⚙️" />
        <AccountLink to="/payments" title="Plan & billing" desc="Manage your subscription" icon="💳" />
        <AccountLink to="/developer" title="Developer API" desc="Manage your Aurevo API keys" icon="🔑" />
      </div>

      {/* Sign Out */}
      <div className="account-actions">
        <button className="btn btn-ghost btn-signout" onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function AccountLink({ to, title, desc, icon }) {
  return (
    <Link to={to} className="account-link glass">
      <span className="account-link-icon">{icon}</span>
      <div className="account-link-content">
        <strong>{title}</strong>
        <p>{desc}</p>
      </div>
      <svg className="account-link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
