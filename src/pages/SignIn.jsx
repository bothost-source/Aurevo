import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard.jsx";
import PasswordField from "../components/auth/PasswordField.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function SignIn() {
  const { signInWithUsername, signInWithGoogle, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    await signInWithUsername(username, password);
    navigate("/");
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to pick up where you left off.">
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <PasswordField value={password} onChange={setPassword} />
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
        <button className="btn btn-ghost" onClick={() => signInWithGoogle().then(() => navigate("/"))}>Google</button>
        <button className="btn btn-ghost" disabled title="Wire up Sign in with Apple in AuthContext">Apple</button>
      </div>
      <div className="auth-card__footer">
        New to Aurevo? <Link to="/sign-up">Create account</Link>
      </div>
    </AuthCard>
  );
}
