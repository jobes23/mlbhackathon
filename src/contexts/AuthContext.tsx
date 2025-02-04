import React, { createContext, useState, useEffect, useContext } from "react";
import { getFirebase } from "../firebase/firebase";
import {
  onAuthStateChanged,
  User,
  signInAnonymously,
  signOut,
  Auth
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

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { auth } = await getFirebase();
        setAuthInstance(auth);
      } catch (error) {
        console.error("Error initializing Firebase Auth:", error);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!authInstance) return;

    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [authInstance]);

  useEffect(() => {
    if (!authInstance) return;

    if (!currentUser && !loading) {
      signInAnonymously(authInstance).catch((error) => {
        console.error("Error signing in anonymously:", error);
      });
    }
  }, [currentUser, loading, authInstance]);

  const handleLogout = async () => {
    if (!authInstance) return;

    try {
      await signOut(authInstance);
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
