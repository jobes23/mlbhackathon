import React, { useState, useEffect, useRef } from "react";
import "./styles/TeamSchedule.css";
import { Translations } from "./constants/Translations";
import { TeamsById } from "./constants/Teams";
import { TeamScheduleProps, Game } from "./types/InterfaceTypes";
import TeamGameStatsModal from "./TeamGameStatsModal";

const API_TEAM_SCHEDULE_URL = import.meta.env.VITE_FETCH_TEAM_SCHEDULE_API_URL;

const TeamSchedule: React.FC<TeamScheduleProps> = ({ teamId, language }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [seasonType, setSeasonType] = useState<string>("regular-season");
  const [games, setGames] = useState<Game[]>([]);
  const [visibleGames, setVisibleGames] = useState<number>(10);
  const [selectedGameStats, setSelectedGameStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const t = Translations[language];

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    setGames([]);
    fetchGames();
    setVisibleGames(10);
  }, [teamId, selectedYear, seasonType]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scheduleRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scheduleRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        loadMoreGames();
      }
    };

    const scheduleElement = scheduleRef.current;
    scheduleElement?.addEventListener("scroll", handleScroll);

    return () => {
      scheduleElement?.removeEventListener("scroll", handleScroll);
    };
  }, [games]);

  const fetchGames = async () => {
    try {
      const response = await fetch(API_TEAM_SCHEDULE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, year: selectedYear, seasonType, language }),
      });
      const data = await response.json();
      if (data.games) {
        setGames(data.games);
      } else {
        console.error("No games found:", data.error);
      }
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreGames = () => {
    setVisibleGames((prev) => prev + 6);
  };

  const fetchGameStats = (gamePk: number, awayTeam: any, homeTeam: any) => {
    setSelectedGameStats({
      gamePK: gamePk,
      boxScore: {
        awayTeam: {
          teamId: awayTeam.teamId,
          teamName: awayTeam.teamName,
          runs: awayTeam.score,
          hits: awayTeam.hits,
          errors: awayTeam.errors,
        },
        homeTeam: {
          teamId: homeTeam.teamId,
          teamName: homeTeam.teamName,
          runs: homeTeam.score,
          hits: homeTeam.hits,
          errors: homeTeam.errors,
        },
      },
    });
  };

  return (
    <div className="schedule-container">
      {/* Filters */}
      <div className="filters">
        <select
          className="season"
          title="Select Year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        >
          {[currentYear, currentYear - 1].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          className="season"
          title="Select Season Type"
          value={seasonType}
          onChange={(e) => setSeasonType(e.target.value)}
        >
          <option value="spring-training">{t.gameTerms.springTraining}</option>
          <option value="regular-season">{t.gameTerms.regularSeason}</option>
          <option value="postseason">{t.gameTerms.postSeason}</option>
        </select>
      </div>

      {/* Schedule Grid */}
      <div className="schedule-grid" ref={scheduleRef}>
        {loading ? (
          <div className="loading-message">{t.actions.loading}</div>
        ) : games.length === 0 ? (
          <div className="no-games-message">{t.actions.noGames}</div>
        ) : (
          games.slice(0, visibleGames).map((game) => {
            const isCompleted = game.isCompleted;
            const awayTeam = TeamsById[game.away_team_id] || {};
            const homeTeam = TeamsById[game.home_team_id] || {};

            return (
              <div
                key={game.game_pk}
                className={`game-row ${isCompleted ? "gameCompleted" : ""}`}
                onClick={
                  isCompleted
                    ? () =>
                        fetchGameStats(
                          game.game_pk,
                          {
                            teamId: game.away_team_id,
                            teamName: game.away_team_name,
                            score: game.away_score,
                            hits: game.away_team_hits,
                            errors: game.away_team_errors,
                          },
                          {
                            teamId: game.home_team_id,
                            teamName: game.home_team_name,
                            score: game.home_score,
                            hits: game.home_team_hits,
                            errors: game.home_team_errors,
                          }
                        )
                    : undefined
                }
              >
                <div className="teams-section">
                  <div className="team-row">
                    <img
                      src={awayTeam.logoURL || ""}
                      alt={`${game.away_team_name} logo`}
                      className="team-logos"
                    />
                    <span className="schedule-team-name">{game.away_team_name}</span>
                    {isCompleted && <span className="team-score">{game.away_score}</span>}
                  </div>
                  <div className="team-row">
                    <img
                      src={homeTeam.logoURL || ""}
                      alt={`${game.home_team_name} logo`}
                      className="team-logos"
                    />
                    <span className="schedule-team-name">{game.home_team_name}</span>
                    {isCompleted && <span className="team-score">{game.home_score}</span>}
                  </div>
                </div>
                <div className="game-metadata">
                  {isCompleted ? (
                    <div className="game-status">
                      <span>{t.status.final}</span>
                      <span>{game.game_date_formatted}</span>
                    </div>
                  ) : (
                    <div className="game-date">{game.game_date_formatted}</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedGameStats && (
        <TeamGameStatsModal gameStats={selectedGameStats} language={language} onClose={() => setSelectedGameStats(null)} />
      )}
    </div>
  );
};

export default TeamSchedule;
