// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase/firebase'; // Import your Firebase configuration
import {
  onAuthStateChanged,
  User,
  signInAnonymously,
  signOut,
} from 'firebase/auth';

interface AuthContextProps {
  currentUser: User | null;
  loading: boolean;
  onLogout: () => Promise<void>; // Return a Promise for logout
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser && !loading) {
      signInAnonymously(auth).catch((error) =>
        console.error('Error signing in anonymously:', error)
      );
    }
  }, [currentUser, loading]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
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
