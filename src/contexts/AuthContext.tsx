import React, { createContext, useState, useEffect, useContext } from "react";
import { initializeFirebase, getFirebase } from "../firebase/firebase";
import {
  onAuthStateChanged,
  User,
  signInAnonymously,
  signOut,
  Auth,
} from "firebase/auth";

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  onLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await initializeFirebase(); // Ensure Firebase is initialized
        const { auth } = getFirebase();
        setAuthInstance(auth);
        setFirebaseReady(true);
      } catch (error) {
        console.error("Error initializing Firebase Auth:", error);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!firebaseReady || !authInstance) return;

    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [firebaseReady, authInstance]);

  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    if (!firebaseReady || !authInstance || signedOut) return;

    if (!currentUser && !loading) {
      signInAnonymously(authInstance).catch((error) => {
        console.error("Error signing in anonymously:", error);
      });
    }
  }, [firebaseReady, currentUser, loading, authInstance, signedOut]);

  const handleLogout = async () => {
    if (!authInstance) return;

    try {
      await signOut(authInstance);
      setSignedOut(true); // Prevent immediate anonymous login
      setCurrentUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value: AuthContextProps = {
    currentUser,
    loading,
    onLogout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
