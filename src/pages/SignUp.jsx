import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import HuskyAvatar from "../components/auth/HuskyAvatar.jsx";
import PasswordStrengthMeter from "../components/auth/PasswordStrengthMeter.jsx";
import "./SignUp.css";

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
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState("NG");
  const [language, setLanguage] = useState("en");
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await signUp({ email, password, username, country, language });
      navigate("/");
    } catch {
      // error handled by AuthContext
    }
  }

  return (
    <div className="signup-container">
      <div className="signup-background" />
      
      <div className="signup-card">
        {/* Husky Avatar - watches typing */}
        <HuskyAvatar 
          focusedField={focusedField}
          showPassword={showPassword}
          hasText={username.length > 0 || email.length > 0}
        />

        <h1 className="signup-title">Create account</h1>
        <p className="signup-subtitle">Your husky is keeping watch</p>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className={`input-group ${focusedField === 'username' ? 'focused' : ''}`}>
            <label>Username</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className={`input-group ${focusedField === 'email' ? 'focused' : ''}`}>
            <label>Email</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className={`input-group ${focusedField === 'password' ? 'focused' : ''}`}>
            <label>Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Password Strength Meter - Vault Style */}
            <PasswordStrengthMeter password={password} />
          </div>

          <div className="select-row">
            <div className={`input-group ${focusedField === 'country' ? 'focused' : ''}`}>
              <label>Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                onFocus={() => setFocusedField('country')}
                onBlur={() => setFocusedField(null)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label} — {c.currency}
                  </option>
                ))}
              </select>
            </div>

            <div className={`input-group ${focusedField === 'language' ? 'focused' : ''}`}>
              <label>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                onFocus={() => setFocusedField('language')}
                onBlur={() => setFocusedField(null)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button 
            type="submit" 
            className={`signup-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            <span className="btn-text">
              {loading ? "Creating account…" : "Create account"}
            </span>
            <div className="btn-door" />
          </button>
        </form>

        <div className="signup-footer">
          Already have an account? <Link to="/sign-in">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
