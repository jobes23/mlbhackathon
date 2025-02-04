import React, { useState, useEffect } from "react";
import "./styles/TeamStats.css";
import { Translations } from "./constants/Translations";

interface TeamStatsProps {
  teamNameEn: string;
  language: string;
}

const API_TEAM_STATS_URL = import.meta.env.VITE_FETCH_TEAM_STATS_GAME_API_URL;

const TeamStats: React.FC<TeamStatsProps> = ({ teamNameEn, language }) => {
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [filteredStats, setFilteredStats] = useState<any[]>([]);
  const [seasonOptions, setSeasonOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>("");
  const [statCategory, setStatCategory] = useState<"bat" | "pit" | "fld">("bat");

  const t = Translations[language];

  useEffect(() => {
    if (!teamNameEn) return;

    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(API_TEAM_STATS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ team_name: teamNameEn, language }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch team stats");
        }

        const data = await response.json();

        if (Array.isArray(data.rows)) {
          setTeamStats(data.rows);
          const games = data.rows.flat();

          // Extract available seasons from games
          const extractedSeasons = Array.from(
            new Set(
              games.map((game: any) => {
                const year = new Date(game.game_date?.value || game.game_date).getFullYear();
                return `${year} ${game.game_type === "Regular Season" ? t.gameTerms.regularSeason : t.gameTerms.postSeason}`;
              })
            )
          ).sort() as string[];

          setSeasonOptions(extractedSeasons);
          setSelectedSeason(extractedSeasons[0] || "");
        } else {
          setTeamStats([]);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamStats();
  }, [teamNameEn, language]);

  useEffect(() => {
    if (!teamStats.length || !selectedSeason) return;

    // Filter games based on selected season
    const filtered = teamStats.filter((game) => {
      const year = new Date(game.game_date?.value || game.game_date).getFullYear();
      const seasonType = game.game_type === "Regular Season" ? t.gameTerms.regularSeason : t.gameTerms.postSeason;
      return `${year} ${seasonType}` === selectedSeason;
    });

    setFilteredStats(filtered);
  }, [teamStats, selectedSeason]);

  if (loading) return <p>{t.actions.loading}</p>;
  if (error) return <p>{t.actions.error}: {error}</p>;
  if (!filteredStats.length) return <p>{t.stats.noStats}</p>;

  // Extract Columns Dynamically based on selected category
  const categoryPrefix = statCategory === "bat" ? "bat_" : statCategory === "pit" ? "pit_" : "fld_";
  const columns = ["game_date", "opponent", ...Object.keys(filteredStats[0] || {}).filter((key) => key.startsWith(categoryPrefix))];

  const formatDate = (dateValue: any) => {
    const actualDate = dateValue?.value || dateValue;
    if (typeof actualDate === "string") {
      const parsedDate = Date.parse(actualDate);
      return isNaN(parsedDate) ? "-" : new Date(parsedDate).toLocaleDateString();
    }
    return "-";
  };

  return (
    <div className="team-stats-container">
      {/* Header - Stat Categories & Season Filter */}
      <div className="stats-header">
        <div className="stat-category-buttons">
          {["bat", "pit", "fld"].map((category) => (
            <button
              key={category}
              className={`stat-button ${statCategory === category ? "active" : ""}`}
              onClick={() => setStatCategory(category as "bat" | "pit" | "fld")}
            >
              {category === "bat" ? t.gameTerms.hitting : category === "pit" ? t.gameTerms.pitching : t.gameTerms.fielding}
            </button>
          ))}
        </div>
        <div className="season-filter">
          <select id="season" value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} title="Select Season">
            {seasonOptions.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Table */}
      <table className="team-stats-table">
        <thead>
          <tr>
            {columns.map((column) => {
              let cleanColumn;
              if (column === "bat_runs") {
                cleanColumn = "runsScored";
              } else if (column === "pit_runs") {
                cleanColumn = "runsAllowed";
              } else {
                cleanColumn = column.replace(/^(bat_|pit_|fld_)/, "");
              }
              return (
                <th key={column} className="team-stats-header">
                  {t.stats[cleanColumn] || cleanColumn.toUpperCase()}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {filteredStats.map((stat, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column} className="team-stats-value">
                  {column === "game_date" ? formatDate(stat[column]) : stat[column] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamStats;
