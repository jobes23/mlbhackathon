export interface Favorites {
    players: number[];
    teams: number[];
  }
  
  export interface PlayerStats {
    id: number;
    name: string;
    name_en: string;
    teamName: string;
    position: string;
    imageUrl: string;
    topStats: { stat_name: string; stat_value: number }[];
    lastGameSummary: string;
  }
  
  export interface TeamStats {
    id: number;
    name: string;
    name_en: string;
    logoUrl: string;
    winLoss: string;
    divisionWinLoss: string;
    hr: number;
    runsScored: number;
    lastGame: string;
    nextGame: string;
  }
  
  export interface FavoritesProps {
    favorites: Favorites;
    onSaveFavorites: (updatedFavorites: Favorites) => void;
    selectedLanguage: string;
  }  
  
  export interface Player {
    id: number;
    name: string;
    position: string;
    teamName: string;
    language: string;
    name_en: string;
  }

  export interface PlayerDetailsModalProps {
    playerId: number;
    playerName: string;
    playerNameEn: string;
    topStats: { stat_name: string; stat_value: number }[];
    language: string;
    onClose: () => void;
    setModalVideo: React.Dispatch<
        React.SetStateAction<{
          video_url: string;
          transcription: string;
          title: string;
        } | null>
      >;
    setIsVideoModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  }

  export interface TeamDetailsModalProps {
    teamId: number;
    teamName: string;
    teamNameEn: string;
    imageUrl: string;
    language: string;
    onClose: () => void;
    setModalVideo: React.Dispatch<
        React.SetStateAction<{
          video_url: string;
          transcription: string;
          title: string;
        } | null>
      >;
    setIsVideoModalOpen: React.Dispatch<React.SetStateAction<boolean>>; 
  }

  export interface GameRulesProps {
    language: string;
  }

  export interface RewardProps {
    reward: {
      id: string;
      name: string;
      pointsRequired: number;
      partner: string;
      description: string;
    };
    onRedeem: () => void;
  }

  export interface PointsProps {
    points: number;
  }

  export interface Notification {
    id: number;
    type: "success" | "error" | "info";
    message: string;
    title?: string; 
    description?: string;
  }
  
  export interface NotificationContextType {
    addNotification: (
      type: "success" | "error" | "info",
      message: string,
      title?: string, 
      description?: string 
    ) => void;
  }
  
  export interface TeamScheduleProps {
    teamId: number;
    language: string;
  }
  
  export interface Game {
    game_pk: number;
    away_team_name: string;
    away_team_id: number;
    home_team_name: string;
    home_team_id: number;
    away_score: number | null;
    home_score: number | null;
    away_team_hits: number | null;
    home_team_hits: number | null;
    away_team_errors: number | null;
    home_team_errors: number | null;
    game_date: string;
    game_date_formatted: string;
    isCompleted: boolean;
    game_type: string;
  }
  