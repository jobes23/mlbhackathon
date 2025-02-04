import React from "react";
import { Translations } from "./constants/Translations";

interface StatCardPlayersProps {
  id: number;
  name: string;
  imageUrl: string;
  language: string;
  stats: { name: string; value: string | number }[];
  lastGameSummary: string;
  onClick: () => void;
}

const parseAndTranslateStats = (input: string, language: string): string => {
  const t = Translations[language] || Translations.en; // Default to English translations

  // If the language is English, return input unchanged
  if (language === "en") {
    return input;
  }

  // Check if input contains valid delimiters
  if ((!input.includes("|") && !input.includes(",")) || (input.includes("|") && !input.includes(","))) {
    return input;
  }

  let statsArray: string[] = [];

  // Split based on pipe or comma
  if (input.includes("|")) {
    const [context, stats] = input.split("|").map((s) => s.trim());
    statsArray = stats.split(",").map((s) => s.trim());
    // Add the context to the translated string
    return `${context} | ${translateStatsArray(statsArray, t)}`;
  } else {
    statsArray = input.split(",").map((s) => s.trim());
    return translateStatsArray(statsArray, t);
  }
};

const translateStatsArray = (statsArray: string[], t: any): string => {
  return statsArray
    .map((stat) => {
      // Attempt to split on space; fallback to entire stat if no space
      const parts = stat.split(" ");
      const key = parts[0]?.toLowerCase();
      const value = parts.length > 1 ? parts.slice(1).join(" ").toLowerCase() : null;

      // Translate key and value
      const translatedKey = t.stats[key] || key;
      const translatedValue = value ? t.stats[value] || value : "";

      return `${translatedKey}${translatedValue ? " " + translatedValue : ""}`;
    })
    .join(", ");
};


const StatCardPlayers: React.FC<StatCardPlayersProps> = ({
  id,
  name,
  imageUrl,
  language,
  stats,
  lastGameSummary,
  onClick,
}) => {
  // Get translations based on the language prop
  const t = Translations[language] || Translations.en;
  // Parse and translate stat names
  const parseStatName = (statName: string): string => {
    const strippedName = statName.replace(/_(pitching|hitting|zscore)/g, "");
    const formattedName = strippedName
      .split("_")
      .map((word) => word.charAt(0).toLowerCase() + word.slice(1))
      .join(" ");
    return t.stats[formattedName] || formattedName;
  };

  return (
    <div className="favorites-card" onClick={onClick}>
      {/* Stats Section */}
      <div className="favorites-stats">
        {/* Top Left */}
        {stats[0] && (
          <div className="favorites-stat-top-left">
            <div className="favorites-details">
              <div className="stat-name">{parseStatName(stats[0].name)}</div>
              <div className="stat-value">{stats[0].value}</div>
            </div>
          </div>
        )}

        {/* Top Right */}
        {stats[1] && (
          <div className="favorites-stat-top-right">
            <div className="favorites-details">
              <div className="stat-name">{parseStatName(stats[1].name)}</div>
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
              <div className="stat-name">{parseStatName(stats[2].name)}</div>
              <div className="stat-value">{stats[2].value}</div>
            </div>
          </div>
        )}

        {/* Bottom Right */}
        {stats[3] && (
          <div className="favorites-stat-bottom-right">
            <div className="favorites-details">
              <div className="stat-name">{parseStatName(stats[3].name)}</div>
              <div className="stat-value">{stats[3].value}</div>
            </div>
          </div>
        )}
      </div>

      {/* Player Image */}
      <div className="favorites-img">
        <img src={imageUrl} alt={name} className="player-image" />
      </div>
      <div className="favorites-name">{name}</div>

      {/* Last Game Summary */}
      <div className="last-game-summary">
        <h3>{t.gameTerms.lastGame || "Last Game Summary"}</h3>
        <p>{parseAndTranslateStats(lastGameSummary, language)}</p>
      </div>
    </div>
  );
};

export default StatCardPlayers;
