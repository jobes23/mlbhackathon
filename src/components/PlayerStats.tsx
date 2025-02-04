import React, { useState, useEffect } from "react";
import "./styles/PlayerStats.css";
import { Translations } from "./constants/Translations";

interface PlayerStatsProps {
  playerId: number;
  language: string;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ playerId, language }) => {
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const t = Translations[language] || Translations.en; // Fallback to English

  const API_URL = import.meta.env.VITE_FETCH_PLAYER_STATS_API_URL;

  useEffect(() => {
    const fetchPlayerStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player_id: playerId, language, statType: "all" }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();

        const filteredStats = (data.data || []).map((season: Record<string, any>) =>
          Object.fromEntries(Object.entries(season).filter(([_, value]) => value !== null))
        );

        setPlayerStats(filteredStats);
      } catch (err) {
        console.error("Error fetching player stats:", err);
        setError(`Failed to load player stats. Please try again.`);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerStats();
  }, [API_URL, playerId, language]);

  if (loading) return <p aria-live="polite">{t.actions.loading}</p>;
  if (error) return <p aria-live="assertive">{t.actions.error}: {error}</p>;
  if (playerStats.length === 0) return <p>{t.stats.noStats}</p>;

  const columns = Object.keys(playerStats[0]);

  return (
    <div>
      <h2 className="player-stat-title">
        {t.stats.playerStats || "Player Statistics"}
      </h2>
      <table className="player-stats-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} className="player-stats-header">
                {t.stats[column] || column.replace(/_/g, " ").toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {playerStats.map((seasonStats, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column} className="player-stats-value">
                  {seasonStats[column] ?? "-"} {/* Display "-" for null values */}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerStats;
