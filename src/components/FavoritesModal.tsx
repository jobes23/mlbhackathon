import React, { useState, useEffect, useCallback } from "react";
import TeamsSelector from "./TeamsSelector";
import PlayersSelector from "./PlayersSelector";
import { Translations } from "./constants/Translations";
import "./styles/FavoritesModal.css";

interface Favorites {
  teams: number[];
  players: number[];
}

interface FavoritesModalProps {
  favorites: Favorites;
  language: string;
  onSave: (updatedFavorites: Favorites) => void;
  onClose: () => void;
}

const FavoritesModal: React.FC<FavoritesModalProps> = ({ favorites, language, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'teams' | 'players'>("teams");
  const t = Translations[language] || Translations["en"]; 

  const handleTeamSelection = useCallback((updatedTeams: number[]) => {
    onSave({ ...favorites, teams: updatedTeams });
  }, [favorites, onSave]);

  const handlePlayerSelection = useCallback((updatedPlayers: number[]) => {
    onSave({ ...favorites, players: updatedPlayers });
  }, [favorites, onSave]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" role="dialog" aria-labelledby="favorites-title">
        {/* Close Modal Button */}
        <button className="close-button" onClick={onClose} aria-label="Close">
          &times;
        </button>

        {/* Modal Title */}
        <h3 id="favorites-title">{t.favoritesMenu.modalTitle}</h3>

        {/* Tab Toggle */}
        <div className="tab-toggle">
          <button
            className={`selection-button ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            {t.favoritesMenu.teamsTab}
          </button>
          <button
            className={`selection-button ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            {t.favoritesMenu.playersTab}
          </button>
        </div>

        {/* Conditional Rendering */}
        {activeTab === 'teams' ? (
          <TeamsSelector
            selectedTeams={favorites.teams}
            onSelectionChange={handleTeamSelection}
          />
        ) : (
          <PlayersSelector
            selectedPlayers={favorites.players}
            onSelectionChange={handlePlayerSelection}
            language={language}
          />
        )}
      </div>
    </div>
  );
};

export default FavoritesModal;
