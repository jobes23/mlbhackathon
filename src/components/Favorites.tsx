import React, { useState, useEffect } from 'react';
import FavoritesButton from './FavoritesButton';
import StatCardPlayers from './StatsCardPlayers';
import StatCardTeams from './StatsCardTeams';
import FavoritesModal from './FavoritesModal';
import PlayerDetailsModal from './PlayerDetailsModal';
import TeamDetailsModal from './TeamDetailsModal';
import VideoModal from './VideoModal';
import { useFetchFavorites } from './hooks/useFetchFavorites';
import { FavoritesProps } from './types/InterfaceTypes';
import { Translations } from './constants/Translations';
import './styles/Favorites.css';
import { useAuth } from '../contexts/AuthContext';

const Favorites: React.FC<FavoritesProps> = ({
  favorites,
  onSaveFavorites,
  selectedLanguage,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState<boolean>(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  
  const [modalPlayer, setModalPlayer] = useState<any>(null);
  const [modalTeam, setModalTeam] = useState<any>(null);
  const [modalVideo, setModalVideo] = useState<any>(null);
  
  const [showSignupPrompt, setShowSignupPrompt] = useState<boolean>(false);
  const { currentUser } = useAuth();

  const t = Translations[selectedLanguage] || Translations.en;

  const { playerStats, teamStats, loading } = useFetchFavorites(
    favorites,
    selectedLanguage,
    t
  );

  // Toggle Favorites Modal
  const handleToggleModal = () => setIsModalOpen(!isModalOpen);

  // Handle Player Details Modal
  const handlePlayerClick = (player: any) => {
    setModalPlayer({
      id: player.id,
      name: player.name,
      name_en: player.name_en || player.name,
      topStats: player.topStats || [],
    });
    setIsPlayerModalOpen(true);
  };

  const handleTeamClick = (team: any) => {
    setModalTeam({
      id: team.id,
      name: team.name,
      name_en: team.name_en || team.name,
      imageUrl: team.logoUrl,
    });
    setIsTeamModalOpen(true);
  };

  const handleClosePlayerModal = () => {
    setIsPlayerModalOpen(false);
    setModalPlayer(null);
  };

  const handleCloseTeamModal = () => {
    setIsTeamModalOpen(false);
    setModalTeam(null);
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setModalVideo(null);
  };

  // Navigation Prompt for Anonymous Users
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (currentUser?.isAnonymous) {
        event.preventDefault();
        event.returnValue = '';
        setShowSignupPrompt(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  return (
    <div className="favorites-container">
      {/* Favorites Button and Modal */}
      <FavoritesButton
        isOpen={isModalOpen}
        toggle={handleToggleModal}
        label={isModalOpen ? t.actions.closeFavorites : t.actions.manageFavorites}
      />

      {isModalOpen && (
        <FavoritesModal
          favorites={favorites}
          onSave={onSaveFavorites}
          onClose={handleToggleModal}
          language={selectedLanguage}
        />
      )}

      {/* Player Details Modal */}
      {isPlayerModalOpen && modalPlayer && (
        <PlayerDetailsModal
          playerId={modalPlayer.id}
          playerName={modalPlayer.name}
          language={selectedLanguage}
          playerNameEn={modalPlayer.name_en}
          onClose={handleClosePlayerModal}
          topStats={modalPlayer.topStats}
          setIsVideoModalOpen={setIsVideoModalOpen}
          setModalVideo={setModalVideo}
        />
      )}

      {/* Team Details Modal */}
      {isTeamModalOpen && modalTeam && (
        <TeamDetailsModal
          teamId={modalTeam.id}
          teamName={modalTeam.name}
          language={selectedLanguage}
          teamNameEn={modalTeam.name_en}
          onClose={handleCloseTeamModal}
          imageUrl={modalTeam.imageUrl}
          setIsVideoModalOpen={setIsVideoModalOpen}
          setModalVideo={setModalVideo}
        />
      )}

      {/* Video Modal */}
      {isVideoModalOpen && modalVideo && (
        <VideoModal
          isOpen={isVideoModalOpen}
          videoData={modalVideo}
          language={selectedLanguage}
          onClose={handleCloseVideoModal}
        />
      )}

      {/* Favorites List */}
      <div className="favorites-list">
        {loading ? (
          <div>{t.actions.loading}</div>
        ) : (
          <>
            <div className="card-section">
              {/* Player Cards */}
              {playerStats.map((player) => (
                <StatCardPlayers
                  key={player.id}
                  id={player.id}
                  name={player.name}
                  imageUrl={player.imageUrl}
                  language={selectedLanguage}
                  stats={player.topStats.map((stat) => ({
                    name: stat.stat_name,
                    value: stat.stat_value,
                  }))}
                  lastGameSummary={player.lastGameSummary}
                  onClick={() => handlePlayerClick(player)}
                />
              ))}
            </div>
            <div className="card-section">
              {/* Team Cards */}
              {teamStats.map((team) => (
                <StatCardTeams
                  key={team.id}
                  id={team.id}
                  name={team.name}
                  imageUrl={team.logoUrl}
                  language={selectedLanguage}
                  stats={[
                    { name: t.stats.winsLosses, value: team.winLoss },
                    { name: t.stats.divisionWinLoss, value: team.divisionWinLoss },
                    { name: t.stats.runsScored, value: team.runsScored },
                    { name: t.stats.hr, value: team.hr },
                  ]}
                  lastGameSummary={team.lastGame}
                  nextGameSummary={team.nextGame}
                  onClick={() => handleTeamClick(team)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Signup Prompt for Anonymous Users */}
      {currentUser?.isAnonymous && showSignupPrompt && (
        <div className="prompt-signup">
          <p>{t.actions.anon}</p>
        </div>
      )}
    </div>
  );
};

export default Favorites;
