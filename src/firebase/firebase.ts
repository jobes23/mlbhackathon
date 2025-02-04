import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

let firebaseApp;
let auth;
let db;

async function initializeFirebase() {
  let firebaseConfig;

  if (import.meta.env.PROD) {
    try {
      const response = await fetch(
        "https://us-central1-mlbhackathon-445616.cloudfunctions.net/getFirebaseConfig"
      );
      firebaseConfig = await response.json();
      console.log("Firebase API Key:", firebaseConfig.apiKey);
    } catch (error) {
      console.error("Failed to fetch Firebase config:", error);
      return; // Stop initialization if config fails to load
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
}

// Ensure Firebase is initialized before export
await initializeFirebase();

export { firebaseApp, auth, db };
