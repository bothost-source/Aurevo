import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider } from "../services/firebase.js";
import { saveProfile, fetchProfile } from "../services/paymentsClient.js";

const AuthContext = createContext(null);

/**
 * Real Firebase Authentication + a real profile stored in Firestore via
 * your backend (server/db.js). Username/password uses Firebase's
 * email/password provider — Firebase Auth doesn't have a native "username"
 * concept, so username/country/language live in Firestore instead, keyed
 * by uid, and are fetched on every sign-in (not just remembered locally,
 * so a profile update shows up after a refresh or on a new device).
 */
export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = not yet resolved
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        const p = await fetchProfile().catch(() => null);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });
    return unsub;
  }, []);

  const value = useMemo(
    () => ({
      user: firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email, ...profile } : null,
      authResolved: firebaseUser !== undefined,
      loading,
      error,

      async signInWithEmail(email, password) {
        setLoading(true);
        setError(null);
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (e) {
          setError(mapFirebaseError(e));
          throw e;
        } finally {
          setLoading(false);
        }
      },

      async signInWithGoogle() {
        setLoading(true);
        setError(null);
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (e) {
          setError(mapFirebaseError(e));
          throw e;
        } finally {
          setLoading(false);
        }
      },

      async signUp({ email, password, username, country, language }) {
        setLoading(true);
        setError(null);
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await saveProfile({ username, country, language });
          setProfile({ username, country, language });
          return cred.user;
        } catch (e) {
          setError(mapFirebaseError(e));
          throw e;
        } finally {
          setLoading(false);
        }
      },

      async signOut() {
        await firebaseSignOut(auth);
        setProfile(null);
      },
    }),
    [firebaseUser, profile, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function mapFirebaseError(e) {
  const code = e?.code || "";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "Incorrect email or password.";
  if (code.includes("user-not-found")) return "No account found with that email.";
  if (code.includes("email-already-in-use")) return "That email is already registered.";
  if (code.includes("weak-password")) return "Choose a stronger password.";
  if (code.includes("popup-closed-by-user")) return "Google sign-in was cancelled.";
  return "Something went wrong. Please try again.";
}
