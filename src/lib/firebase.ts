import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirebaseConfig } from "@/config/env";

let auth: Auth | null = null;

try {
  const config = getFirebaseConfig();
  if (config) {
    const app: FirebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    auth = getAuth(app);
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { auth };
