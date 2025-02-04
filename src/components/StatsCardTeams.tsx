import React from "react";
import { Translations } from "./constants/Translations";

interface StatCardTeamsProps {
  id: number;
  name: string;
  imageUrl: string;
  language: string;
  stats: { name: string; value: string | number }[];
  lastGameSummary: string;
  nextGameSummary: string;
  onClick: () => void;
}

const parseAndTranslateStats = (input: string, language: string): string => {
  const t = Translations[language] || Translations.en; // Default to English translations

  // Regular expressions for parsing abbreviations and numbers
  const regex = /\b(IP|HR|2B|3B|BB|K|ER|R|H|AB|QS|LOB|HBP)\b|\d+(\.\d+)?/g;

  // Replace matched abbreviations and numbers
  return input.replace(regex, (match) => {
    const lowerCaseMatch = match.toLowerCase(); // Normalize to lowercase for consistent matching
    if (t[lowerCaseMatch]) {
      return t[lowerCaseMatch]; // Translate if found in translations
    }
    return match; // Return the original value if no translation exists
  });
};

const StatCardTeams: React.FC<StatCardTeamsProps> = ({
  id,
  name,
  imageUrl,
  language,
  stats,
  lastGameSummary,
  nextGameSummary,
  onClick,
}) => {
  // Get translations based on the language prop
  const t = Translations[language] || Translations.en;
  return (
    <div className="favorites-card" onClick={onClick}>
      {/* Stats Section */}
      <div className="favorites-stats">
        {/* Top Left */}
        {stats[0] && (
          <div className="favorites-stat-top-left">
            <div className="favorites-details">
              <div className="stat-name">{stats[0].name}</div>
              <div className="stat-value">{stats[0].value}</div>
            </div>
          </div>
        )}

        {/* Top Right */}
        {stats[1] && (
          <div className="favorites-stat-top-right">
            <div className="favorites-details">
              <div className="stat-name">{stats[1].name}</div>
              <div className="stat-value">{stats[1].value}</div>
            </div>
          </div>
        )}

        {/* Current Season Label */}
        <div className="favorites-current-season">
          <span>{t.gameTerms.currentSeason || "Current Season"}</span>
        </div>

        {/* Bottom Left */}
        {stats[2] && (
          <div className="favorites-stat-bottom-left">
            <div className="favorites-details">
              <div className="stat-name">{stats[2].name}</div>
              <div className="stat-value">{stats[2].value}</div>
            </div>
          </div>
        )}

        {/* Bottom Right */}
        {stats[3] && (
          <div className="favorites-stat-bottom-right">
            <div className="favorites-details">
              <div className="stat-name">{stats[3].name}</div>
              <div className="stat-value">{stats[3].value}</div>
            </div>
          </div>
        )}
      </div>

      {/* Player Image */}
      <div className="favorites-team-img">
        <img src={imageUrl} alt={name} className="teams-image" />
      </div>
      <div className="favorites-name">{name}</div>

      {/* Last Game Summary */}
      <div className="last-game-summary">
        <h3>{t.gameTerms.lastGame || "Last Game Summary"}</h3>
        <p>{parseAndTranslateStats(lastGameSummary, language)}</p>
      </div>
      <div className="last-game-summary">
        <h3>{t.gameTerms.nextGame || "Next Game"}</h3>
        <p>{parseAndTranslateStats(nextGameSummary, language)}</p>
      </div>
    </div>
  );
};

export default StatCardTeams;
