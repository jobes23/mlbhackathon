import React, { useState, useEffect, useMemo } from "react";
import { FaBars, FaTimes, FaBook, FaGamepad, FaStar, FaCoins } from "react-icons/fa";
import fandugoutLogo from "./assets/fandugout.png";
import { LanguageKeys } from "./constants/LanguageKeys";
import "./styles/SideBar.css";
import { useAuth } from "../contexts/AuthContext";
import { getFirebase } from "../firebase/firebase"; // Fetch auth dynamically
import { Link, useNavigate } from "react-router-dom";
import RewardsChallengesModal from "./RewardsChallengesModal";

interface MenuItem {
  icon: React.ReactNode;
  text: string;
  route?: string;
  onClick?: () => void;
}

interface SideBarProps {
  userPoints: number;
  selectedLanguage: LanguageKeys;
  setSelectedLanguage: (language: LanguageKeys) => void;
  onLogout: () => void;
}

const translations: Record<
  LanguageKeys,
  { menuItems: MenuItem[]; auth: { login: string; logout: string; signup: string } }
> = {
  en: {
    menuItems: [
      { icon: <FaStar />, text: "Favorites", route: "/" },
      { icon: <FaBook />, text: "Rules 101", route: "/rules" },
      { icon: <FaGamepad />, text: "Trivia", route: "/trivia" },
      { icon: <FaCoins />, text: "Rewards", onClick: () => {} }, // Placeholder for rewards modal
    ],
    auth: {
      login: "Login",
      logout: "Logout",
      signup: "Sign Up",
    },
  },
  ja: {
    menuItems: [
      { icon: <FaStar />, text: "お気に入り", route: "/" },
      { icon: <FaBook />, text: "基本ルール", route: "/rules" },
      { icon: <FaGamepad />, text: "トリビア", route: "/trivia" },
      { icon: <FaCoins />, text: "報酬", onClick: () => {} },
    ],
    auth: {
      login: "ログイン",
      logout: "ログアウト",
      signup: "サインアップ",
    },
  },
  es: {
    menuItems: [
      { icon: <FaStar />, text: "Favoritos", route: "/" },
      { icon: <FaBook />, text: "Reglas Básicas", route: "/rules" },
      { icon: <FaGamepad />, text: "Trivia", route: "/trivia" },
      { icon: <FaCoins />, text: "Premios", onClick: () => {} },
    ],
    auth: {
      login: "Iniciar sesión",
      logout: "Cerrar sesión",
      signup: "Registrarse",
    },
  },
};

const SideBar: React.FC<SideBarProps> = ({ userPoints, selectedLanguage, setSelectedLanguage, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [userPointBalance, setUserPoints] = useState(userPoints);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setUserPoints(userPoints);
  }, [userPoints]);

  const { menuItems, auth: authTranslations } = translations[selectedLanguage];

  const menuItemsWithRewards = useMemo(() => {
    return menuItems.map((item) =>
      item.text === translations[selectedLanguage].menuItems[3].text
        ? { ...item, onClick: () => setIsRewardsModalOpen(true) }
        : item
    );
  }, [selectedLanguage]);

  const handleLogout = async () => {
    try {
      const { auth } = await getFirebase(); // Get Firebase auth dynamically
      await auth.signOut();
      onLogout();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`menu-toggle ${!isMenuOpen ? "menu-bars-active" : ""}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
      >
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isMenuOpen ? "open" : ""}`}>
        <div className="menu-header">
          <img src={fandugoutLogo} alt="Fan Dugout Logo" className="logo" />
        </div>

        <div className={`menu ${isMenuOpen ? "visible" : "hidden"}`}>
          {menuItemsWithRewards.map((item) =>
            item.route ? (
              <Link to={item.route} key={item.text} className="no-link-style" onClick={() => setIsMenuOpen(false)}>
                <div className="menu-item">
                  <div className="menu-icon">{item.icon}</div>
                  <div className="menu-text">{item.text}</div>
                </div>
              </Link>
            ) : (
              <div key={item.text} className="menu-item" onClick={item.onClick}>
                <div className="menu-icon">
                  {item.text === translations[selectedLanguage].menuItems[3].text && (
                    <span className="menu-points">{userPointBalance}</span>
                  )}
                  {item.icon}
                </div>
                <div className="menu-text">{item.text}</div>
              </div>
            )
          )}

          {/* Language Selector */}
          <div className="language-selector">
            <select
              id="language"
              aria-label="Select Language"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as LanguageKeys)}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="ja">日本語</option>
            </select>
          </div>

          {/* Auth Buttons */}
          <div className="auth-buttons">
            {!currentUser ? (
              <>
                <Link to="/login" className="no-link-style">
                  <button className="auth-button">{authTranslations.login}</button>
                </Link>
                <Link to="/signup" className="no-link-style">
                  <button className="auth-button">{authTranslations.signup}</button>
                </Link>
              </>
            ) : (
              <button onClick={handleLogout} className="auth-button">
                {authTranslations.logout}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Rewards Modal */}
      {isRewardsModalOpen && currentUser && (
        <RewardsChallengesModal
          userId={currentUser.uid}
          language={selectedLanguage}
          userPoints={userPointBalance}
          setUserPoints={(points) => setUserPoints(points)}
          onClose={() => {
            setIsRewardsModalOpen(false);
            setUserPoints(userPoints);
          }}
        />
      )}
    </>
  );
};

export default SideBar;
