import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Function to initialize Firebase **only after** fetching config.
 */
async function initializeFirebase() {
  if (firebaseApp) return { firebaseApp, auth, db }; // Return if already initialized

  let firebaseConfig;

  if (import.meta.env.PROD) {
    try {
      const response = await fetch(
        "https://us-central1-mlbhackathon-445616.cloudfunctions.net/getfirebaseconfig"
      );
      firebaseConfig = await response.json();
    } catch (error) {
      console.error("Failed to fetch Firebase config:", error);
      throw new Error("Failed to load Firebase config"); // Prevents accidental usage with an invalid config
    }
  } else {
    firebaseConfig = {
      apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
    };
  }

  console.log("Initializing Firebase with config:", firebaseConfig);

  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);

  return { firebaseApp, auth, db };
}

export { initializeFirebase };
