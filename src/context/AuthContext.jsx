import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

/**
 * Placeholder auth state. Replace the signIn/signUp bodies with real calls
 * to your Firebase Authentication (Google Sign-In) + your own backend for
 * username/password verification. Never store passwords here or anywhere
 * in the frontend — this context only ever holds the signed-in user's
 * public profile, never a credential.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const value = useMemo(
    () => ({
      user,
      loading,
      async signInWithUsername(username, _password) {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 700)); // simulate network
        setLoading(false);
        setUser({ username, country: "NG", language: "en" });
      },
      async signInWithGoogle() {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 700));
        setLoading(false);
        setUser({ username: "google-user", country: "NG", language: "en" });
      },
      async signUp({ username, country, language }) {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 700));
        setLoading(false);
        setUser({ username, country, language });
      },
      signOut() {
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
