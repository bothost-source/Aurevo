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

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined);
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
          // Step 1: Create Firebase auth user
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          
          // Step 2: Save profile to backend (non-blocking if it fails)
          try {
            await saveProfile({ username, country, language });
            setProfile({ username, country, language });
          } catch (profileErr) {
            console.warn("Profile save failed, but account created:", profileErr);
            // Don't throw - account is created, profile can be updated later
          }
          
          return cred.user;
        } catch (e) {
          // Handle specific Firebase errors
          if (e.code === "auth/email-already-in-use") {
            setError("That email is already registered. Try signing in instead.");
          } else if (e.code === "auth/weak-password") {
            setError("Choose a stronger password (at least 6 characters).");
          } else if (e.code === "auth/invalid-email") {
            setError("Please enter a valid email address.");
          } else if (e.code === "auth/network-request-failed") {
            setError("Network error. Check your internet connection.");
          } else {
            setError(mapFirebaseError(e));
          }
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
  if (code.includes("email-already-in-use")) return "That email is already registered. Try signing in.";
  if (code.includes("weak-password")) return "Choose a stronger password (at least 6 characters).";
  if (code.includes("popup-closed-by-user")) return "Google sign-in was cancelled.";
  if (code.includes("network-request-failed")) return "Network error. Check your connection.";
  return "Something went wrong. Please try again.";
}
