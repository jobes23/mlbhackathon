import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

async function fetchFirebaseConfig() {
  if (import.meta.env.PROD) {
    // Fetch from Firebase Cloud Function in production
    const response = await fetch("https://us-central1-mlbhackathon-445616.cloudfunctions.net/getFirebaseConfig");
    const data = await response.json();
    return data;
  } else {
    // Use Vite env variables in development
    return {
      apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
    };
  }
}

const firebaseConfig = await fetchFirebaseConfig();

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };