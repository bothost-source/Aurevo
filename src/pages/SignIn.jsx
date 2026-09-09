import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard.jsx";
import PasswordField from "../components/auth/PasswordField.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function SignIn() {
  const { signInWithEmail, signInWithGoogle, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
      navigate("/");
    } catch {
      // error state is already set by AuthContext and rendered below
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <PasswordField value={password} onChange={setPassword} />
        {error && <p className="error-text" style={{ marginTop: -8, marginBottom: 12 }}>{error}</p>}
        <div className="auth-card__row">
          <label>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="auth-card__divider">or continue with</div>
      <div className="auth-card__oauth">
        <button className="btn btn-ghost" onClick={() => signInWithGoogle().then(() => navigate("/")).catch(() => {})}>
          Google
        </button>
      </div>

      <div className="auth-card__footer">
        New to Aurevo? <Link to="/sign-up">Create account</Link>
      </div>
    </AuthCard>
  );
}
