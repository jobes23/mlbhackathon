// src/firebase.d.ts or src/types/firebase.d.ts
declare module 'firebase' {
    import { initializeApp } from 'firebase/app';
    import { getAuth } from 'firebase/auth';
    // ... other Firebase services you're using
  
    const firebaseConfig: Record<string, string>; // Or a more specific type if you prefer
  
    const app: ReturnType<typeof initializeApp>;
    const auth: ReturnType<typeof getAuth>;
    // ... other exports from firebase.js
  
    export { auth }; // Export the services you're using
    // Or: export default app; if you are exporting the app instance
  }