import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase is used ONLY to verify the user's mobile number via SMS OTP.
// The primary account/auth still lives in Supabase (email + password).
// These NEXT_PUBLIC_ values come from the Firebase console → Project settings.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True only when the Firebase env vars are present (so we can build without them). */
export function firebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.appId
  );
}

/**
 * Lazily initialise Firebase Auth in the browser. Returns null when the config
 * is missing, so callers can show a friendly "not configured" message instead
 * of crashing the build / page.
 */
export function getFirebaseAuth() {
  if (typeof window === "undefined" || !firebaseConfigured()) return null;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}
