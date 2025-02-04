import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export async function initializeFirebase() {
  if (firebaseApp) return { firebaseApp, auth, db };

  let firebaseConfig;

  if (import.meta.env.PROD) {
    // Fetch Firebase config from a secure API endpoint in production
    try {
      const response = await fetch(import.meta.env.VITE_GET_FIREBASE_CONFIG_URL);
      firebaseConfig = await response.json();
      console.log("Firebase config (Production):", firebaseConfig);
    } catch (error) {
      console.error("Failed to fetch Firebase config:", error);
      throw new Error("Failed to load Firebase config");
    }
  } else {
    // Use Vite environment variables in development
    firebaseConfig = {
      apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
    };
    console.log("Firebase config (Development):", firebaseConfig);
  }

  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  getAnalytics(firebaseApp);

  return { firebaseApp, auth, db };
}

// Export auth and db for convenience
export { firebaseApp, auth, db };
