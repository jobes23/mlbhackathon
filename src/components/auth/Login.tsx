import React, { useState, useEffect } from "react";
import { initializeFirebase, getFirebase } from "../../firebase/firebase";
import { GoogleAuthProvider, signInWithPopup, User, Auth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        await initializeFirebase();
        const { auth } = getFirebase();
        setAuthInstance(auth);
      } catch (error) {
        console.error("Error initializing Firebase Auth:", error);
        setError("Failed to initialize authentication service.");
      }
    };
    initAuth();
  }, []);

  const handleGoogleLogin = async () => {
    if (!authInstance) {
      setError("Authentication service is not ready.");
      return;
    }
  
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(authInstance, provider);
      const user = result.user;
  
      console.log("User signed in:", user);
  
      console.log("Calling API:", import.meta.env.VITE_SETUP_USER_API_URL);
      const response = await fetch(import.meta.env.VITE_SETUP_USER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      });
  
      if (!response.ok) {
        throw new Error(`API returned error: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("API Response:", data);
  
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      setError("Failed to sign in with Google.");
    }
  };  

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>
        <button onClick={handleGoogleLogin} className="form-button" disabled={!authInstance}>
          Sign in with Google
        </button>
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
