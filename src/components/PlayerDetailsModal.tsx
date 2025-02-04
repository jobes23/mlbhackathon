import React, { useState, lazy, Suspense } from "react";
import "./styles/CardDetailsModal.css";
import { Translations } from "./constants/Translations";
import { PlayerDetailsModalProps } from "./types/InterfaceTypes";

const PlayerVideos = lazy(() => import("./PlayerVideos"));
const PlayerStats = lazy(() => import("./PlayerStats"));
const PlayerArticles = lazy(() => import("./PlayerArticles"));
const PlayerBets = lazy(() => import("./PlayerBets"));

const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({
  playerId,
  playerName,
  playerNameEn,
  topStats,
  language,
  onClose,
  setIsVideoModalOpen,
  setModalVideo,
}) => {
  const [activeTab, setActiveTab] = useState<string>("");
  const [tabsLoaded, setTabsLoaded] = useState<Record<string, boolean>>({
    articles: false,
    stats: false,
    videos: false,
    bets: false,
  });
  console.log(playerId);
  const handleTabClick = (tab: string) => {
    if (activeTab !== tab) setActiveTab(tab);
    if (!tabsLoaded[tab]) {
      setTabsLoaded((prev) => ({ ...prev, [tab]: true }));
    }
  };

  const t = Translations[language] || Translations.en;

  return (
    <div
      className="player-details-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="player-modal-title"
    >
      <div className="modal-content">
        <button className="close-button" onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        <div className="modal-top">
          <div className="player-image-container">
            <img
              src={`https://midfield.mlbstatic.com/v1/people/${playerId}/spots/120`}
              alt={playerName}
              className="player-image"
            />
            <div className="player-name" id="player-modal-title">{playerName}</div>
          </div>
        </div>

        <div className="tabs">
          {['articles', 'stats', 'videos', 'bets'].map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabClick(tab)}
              aria-label={t.menu?.[tab] || tab}
            >
              {t.menu?.[tab] || tab}
            </button>
          ))}
        </div>

        <div className="tab-content">
          <Suspense fallback={<div>Loading...</div>}>
            {activeTab === "articles" && tabsLoaded.articles && (
              <PlayerArticles playerName={playerName} language={language} playerNameEn={playerNameEn} />
            )}
            {activeTab === "stats" && tabsLoaded.stats && <PlayerStats playerId={playerId} language={language} />}
            {activeTab === "videos" && tabsLoaded.videos && (
              <PlayerVideos
                playerId={playerId}
                language={language}
                setIsVideoModalOpen={setIsVideoModalOpen}
                setModalVideo={setModalVideo}
              />
            )}
            {activeTab === "bets" && tabsLoaded.bets && (
              <PlayerBets topStats={topStats} language={language} playerName={playerName} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailsModal;
