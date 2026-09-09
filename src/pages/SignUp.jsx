import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard.jsx";
import PasswordField from "../components/auth/PasswordField.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const COUNTRIES = [
  { code: "NG", label: "Nigeria", currency: "NGN" },
  { code: "US", label: "United States", currency: "USD" },
  { code: "GB", label: "United Kingdom", currency: "GBP" },
  { code: "GH", label: "Ghana", currency: "GHS" },
  { code: "KE", label: "Kenya", currency: "KES" },
  { code: "ZA", label: "South Africa", currency: "ZAR" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yorùbá" },
  { code: "ig", label: "Igbo" },
];

export default function SignUp() {
  const { signUp, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("NG");
  const [language, setLanguage] = useState("en");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await signUp({ email, password, username, country, language });
      navigate("/");
    } catch {
      // error state is already set by AuthContext and rendered below
    }
  }

  return (
    <AuthCard title="Create your account" subtitle="Movies, music and music videos — one place, your currency.">
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="new-username">Username</label>
          <input id="new-username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <PasswordField label="Password" value={password} onChange={setPassword} showStrength autoComplete="new-password" />

        <div className="field">
          <label htmlFor="country">Country</label>
          <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label} — priced in {c.currency}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="language">Language</label>
          <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        {error && <p className="error-text" style={{ marginTop: -8, marginBottom: 12 }}>{error}</p>}

        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="auth-card__footer">
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </div>
    </AuthCard>
  );
}
