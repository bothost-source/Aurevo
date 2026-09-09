/**
 * Firebase Admin SDK — server-side only. This is what lets the backend
 * verify a user's identity (from the ID token the frontend sends) and
 * read/write Firestore with full privileges, bypassing client security
 * rules (which is correct here: the server IS the trusted backend).
 *
 * Setup: Firebase Console -> Project settings (gear icon) -> Service
 * accounts tab -> "Generate new private key". That downloads a JSON file.
 *
 * Two ways to provide it, pick whichever fits where you're running:
 * - Local/Termux: save the file as server/serviceAccountKey.json (already
 *   gitignored, never commit it) and leave FIREBASE_SERVICE_ACCOUNT_JSON unset.
 * - Render (or any host without file uploads on the free tier): paste the
 *   ENTIRE downloaded JSON file's contents as one line into the
 *   FIREBASE_SERVICE_ACCOUNT_JSON environment variable instead.
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "fs";

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is set but isn't valid JSON — paste the whole downloaded file's contents as-is, on one line.");
    }
  }
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json";
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(
      `Could not read Firebase service account file at "${path}", and FIREBASE_SERVICE_ACCOUNT_JSON isn't set. Download it from ` +
      `Firebase Console -> Project settings -> Service accounts -> Generate new private key, ` +
      `then either save it at that path or paste its contents into FIREBASE_SERVICE_ACCOUNT_JSON.`
    );
  }
}

if (getApps().length === 0) {
  initializeApp({ credential: cert(loadServiceAccount()) });
}

export const db = getFirestore();
export const adminAuth = getAuth();

/** Express middleware: verifies the Firebase ID token in the Authorization
 *  header and attaches the decoded user to req.firebaseUser. Rejects the
 *  request outright if the token is missing or invalid — every route that
 *  touches a specific user's data should use this rather than trusting
 *  whatever uid the client claims in the request body. */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing Authorization: Bearer <Firebase ID token> header." });
  }
  try {
    req.firebaseUser = await adminAuth.verifyIdToken(token);
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid or expired auth token." });
  }
}
