import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

let firebaseApp: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export async function getFirebase() {
  if (firebaseApp) return { auth: authInstance as Auth, db: dbInstance as Firestore };

  let firebaseConfig;

  if (import.meta.env.PROD) {
    try {
      const response = await fetch("https://us-central1-mlbhackathon-445616.cloudfunctions.net/getfirebaseconfig");
      firebaseConfig = await response.json();
    } catch (error) {
      console.error("Failed to fetch Firebase config:", error);
      throw new Error("Failed to load Firebase config");
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

  firebaseApp = initializeApp(firebaseConfig);
  authInstance = getAuth(firebaseApp);
  dbInstance = getFirestore(firebaseApp);
  getAnalytics(firebaseApp);

  return { auth: authInstance, db: dbInstance };
}
