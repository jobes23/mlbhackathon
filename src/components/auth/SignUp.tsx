import React, { useState, useEffect } from "react";
import { getFirebase } from "../../firebase/firebase";
import { GoogleAuthProvider, signInWithPopup, User, Auth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

const Signup: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { auth } = await getFirebase();
        setAuthInstance(auth);
      } catch (error) {
        console.error("Error initializing Firebase Auth:", error);
      }
    };
    initAuth();
  }, []);

  const setupUser = async (user: User) => {
    try {
      const response = await fetch(import.meta.env.VITE_SETUP_USER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      });

      if (!response.ok) {
        throw new Error("Failed to set up user.");
      }
    } catch (error) {
      console.error("Error setting up user:", error);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!authInstance) {
      setError("Authentication service is not ready.");
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(authInstance, provider);
      const user = result.user;

      await setupUser(user);

      navigate("/");
    } catch (error) {
      setError("Google Sign-Up failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Sign Up</h2>
        <button onClick={handleGoogleSignUp} className="form-button" disabled={!authInstance}>
          Sign up with Google
        </button>
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  );
};

export default Signup;
