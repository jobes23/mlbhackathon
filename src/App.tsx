import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import SideBar from "./components/SideBar";
import Favorites from "./components/Favorites";
import TeamsSelector from "./components/TeamsSelector";
import GameRules from "./components/MLBRules";
import Trivia from "./components/Trivia";
import "./App.css";
import { LanguageKeys } from "./components/constants/LanguageKeys";
import Login from "./components/auth/Login";
import Signup from "./components/auth/SignUp";
import { useAuth } from "./contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase/firebase";
import useSyncUserChallenges from "./components/hooks/useSyncUserChallenges";
import { useNotification } from "./components/NotificationProvider";
import { Translations } from "./components/constants/Translations";

const FETCH_CHALLENGE_API_URL = import.meta.env.VITE_FETCH_CHALLENGE_API_URL;
const SET_CHALLENGE_STATUS_API_URL = import.meta.env.VITE_SET_CHALLENGE_STATUS_API_URL;

interface FavoritesState {
  players: number[];
  teams: number[];
}

const App: React.FC = () => {
  const { currentUser, onLogout, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKeys>("en");
  const [favorites, setFavorites] = useState<FavoritesState>({ players: [], teams: [] });
  const [challengeStatus, setChallengeStatus] = useState<Record<string, boolean>>({});
  const [appLoading, setAppLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const navigate = useNavigate();
  const t = Translations[selectedLanguage];

  useSyncUserChallenges(currentUser?.uid || null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const savedFavorites = Cookies.get("favorites");
        const savedLanguage = Cookies.get("language");

        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }

        const validLanguage =
          savedLanguage && ["en", "de", "ja", "es"].includes(savedLanguage)
            ? (savedLanguage as LanguageKeys)
            : "en";

        if (currentUser && !currentUser.isAnonymous) {
          const userRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setFavorites(userData.favorites || { players: [], teams: [] });
            setUserPoints(userData.points || 0);
            setSelectedLanguage(userData.language || validLanguage);

            await fetchChallengeStatus("fav_follow_five");
          } else {
            await setDoc(userRef, { favorites: { players: [], teams: [] }, language: validLanguage });
            setSelectedLanguage(validLanguage);
          }
        } else {
          setSelectedLanguage(validLanguage);
        }
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setAppLoading(false);
      }
    };

    if (!authLoading) {
      initApp();
    }
  }, [authLoading, currentUser]);

  /**
   * Fetches the challenge status for a specific challenge ID
   */
  const fetchChallengeStatus = async (challengeId: string) => {
    if (!currentUser) return;
    console.log(FETCH_CHALLENGE_API_URL)

    try {
      const response = await fetch(FETCH_CHALLENGE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          challengeId: challengeId,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch challenge status for ${challengeId}.`);
      }

      const data = await response.json();
      setChallengeStatus((prev) => ({ ...prev, [challengeId]: data.completed || false }));
    } catch (error) {
      console.error(`Error fetching challenge status for ${challengeId}:`, error);
    }
  };

  /**
   * Completes a challenge and displays the translated challenge description
   */
  const completeChallenge = async (challengeId: string) => {
    if (!currentUser || challengeStatus[challengeId]) return;

    try {
      const response = await fetch(FETCH_CHALLENGE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          challengeId: challengeId,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch challenge details for ${challengeId}`);
      }

      const challenge = await response.json();

      await fetch(SET_CHALLENGE_STATUS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          challengeId: challengeId,
          action: "completed",
        }),
      });

      setChallengeStatus((prev) => ({ ...prev, [challengeId]: true }));

      addNotification("success", `${t.rewards.completed}`, challenge.name, challenge.description);
    } catch (error) {
      console.error(`Error completing challenge ${challengeId}:`, error);
    }
  };

  const handleSaveFavorites = async (newFavorites: FavoritesState) => {
    setFavorites(newFavorites);

    if (currentUser) {
      if (currentUser.isAnonymous) {
        Cookies.set("favorites", JSON.stringify(newFavorites), { expires: 7 });
      } else {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, { favorites: newFavorites }, { merge: true });
      }
    }
  };

  const handleLanguageChange = async (newLanguage: LanguageKeys) => {
    setSelectedLanguage(newLanguage);
    Cookies.set("language", newLanguage, { expires: 7 });

    if (currentUser && !currentUser.isAnonymous) {
      const userRef = doc(db, "users", currentUser.uid);
      try {
        await setDoc(userRef, { language: newLanguage }, { merge: true });
      } catch (error) {
        console.error("Error updating language in Firestore:", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await onLogout();
      Cookies.remove("favorites");
      Cookies.remove("language");
      setFavorites({ players: [], teams: [] });
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (appLoading || authLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app-container">
      <SideBar selectedLanguage={selectedLanguage} userPoints={userPoints} setSelectedLanguage={handleLanguageChange} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Favorites favorites={favorites} onSaveFavorites={handleSaveFavorites} selectedLanguage={selectedLanguage} />} />
          <Route path="/teams" element={<TeamsSelector selectedTeams={favorites.teams} onSelectionChange={(updatedTeams) => handleSaveFavorites({ ...favorites, teams: updatedTeams })} />} />
          <Route path="/rules" element={<GameRules language={selectedLanguage} />} />
          <Route path="/trivia" element={<Trivia selectedLanguage={selectedLanguage} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
