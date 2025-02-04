import React, { useState, useMemo } from "react";
import "./styles/CardDetailsModal.css";
import TeamVideos from "./TeamVideos";
import TeamStats from "./TeamStats";
import TeamArticles from "./TeamArticles";
import TeamBets from "./TeamBets";
import TeamSchedule from "./TeamSchedule";
import { Translations } from "./constants/Translations";
import { TeamDetailsModalProps } from "./types/InterfaceTypes";

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  teamId,
  teamName,
  teamNameEn,
  imageUrl,
  language,
  onClose,
  setIsVideoModalOpen,
  setModalVideo,
}) => {
  const [activeTab, setActiveTab] = useState<string>("articles");
  const [tabsLoaded, setTabsLoaded] = useState<Record<string, boolean>>({
    articles: true,
    schedule: false,
    videos: false,
    bets: false,
  });

  const handleTabClick = (tab: string) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      if (!tabsLoaded[tab]) {
        setTabsLoaded((prev) => ({ ...prev, [tab]: true })); // Mark tab as loaded
      }
    }
  };

  const t = useMemo(() => Translations[language] || Translations.en, [language]);

  return (
    <div
      className="player-details-modal"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("player-details-modal")) onClose();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-content">
        <button className="close-button" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <div className="modal-top">
          <div className="player-image-container">
            <img src={imageUrl} alt={`${teamName}`} className="teams-image" />
            <div className="player-name">{teamName}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {["articles", "schedule", "videos", "bets"].map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
              aria-label={t.menu[tab] || tab}
            >
              {t.menu?.[tab] || tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "articles" && tabsLoaded.articles && (
            <TeamArticles teamName={teamName} language={language} teamNameEn={teamNameEn} />
          )}
          {activeTab === "schedule" && tabsLoaded.schedule && <TeamSchedule teamId={teamId} language={language} />}
          {activeTab === "videos" && tabsLoaded.videos && (
            <TeamVideos teamId={teamId} language={language} setIsVideoModalOpen={setIsVideoModalOpen} setModalVideo={setModalVideo} />
          )}
          {activeTab === "bets" && tabsLoaded.bets && <TeamBets teamName={teamNameEn} language={language} />}
        </div>
      </div>
    </div>
  );
};

export default TeamDetailsModal;
