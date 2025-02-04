import React, { useEffect, useState } from "react";
import "./styles/TeamGameStatsModal.css";
import { Translations } from "./constants/Translations";

interface PlayerStats {
  player_id: number;
  player_name: string;
  team_name: string;
  hitting?: string;
  pitching?: string;
  team_id: number;
}

interface TeamGameStatsModalProps {
  gameStats: {
    gamePK: number;
    boxScore: {
      awayTeam: { teamId: number; teamName: string; runs: number; hits: number; errors: number };
      homeTeam: { teamId: number; teamName: string; runs: number; hits: number; errors: number };
    };
  };
  language: string;
  onClose: () => void;
}

const TeamGameStatsModal: React.FC<TeamGameStatsModalProps> = ({ gameStats, language, onClose }) => {
  const { gamePK, boxScore } = gameStats;
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home");
  const t = Translations[language];
  const API_PLAYER_STATS_URL = import.meta.env.VITE_FETCH_PLAYER_STATS_API_URL;

  useEffect(() => {
    fetchPlayerStats();
  }, [gamePK, language]);

  const fetchPlayerStats = async () => {
    try {
      const response = await fetch(API_PLAYER_STATS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_pk: gamePK, language }),
      });
      const data = await response.json();
      if (data.data) {
        setPlayerStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching player stats:", error);
    }
  };

  const calculateTotals = (players: PlayerStats[], type: "hitting" | "pitching") => {
    return players.reduce((totals: Record<string, number>, player) => {
      const stats = JSON.parse(player[type] || "{}");
      Object.keys(stats).forEach((key) => {
        totals[key] = (totals[key] || 0) + (stats[key] || 0);
      });
      return totals;
    }, {});
  };

  const awayTeamPlayers = playerStats.filter((player) => player.team_id === boxScore.awayTeam.teamId);
  const homeTeamPlayers = playerStats.filter((player) => player.team_id === boxScore.homeTeam.teamId);

  const awayHitters = awayTeamPlayers.filter((player) => player.hitting && player.hitting !== "{}");
  const awayPitchers = awayTeamPlayers.filter((player) => player.pitching && player.pitching !== "{}");
  const homeHitters = homeTeamPlayers.filter((player) => player.hitting && player.hitting !== "{}");
  const homePitchers = homeTeamPlayers.filter((player) => player.pitching && player.pitching !== "{}");

  const activeTeamName = selectedTeam === "home" ? boxScore.homeTeam.teamName : boxScore.awayTeam.teamName;
  const activeHitters = selectedTeam === "home" ? homeHitters : awayHitters;
  const activePitchers = selectedTeam === "home" ? homePitchers : awayPitchers;

  const hitterTotals = calculateTotals(activeHitters, "hitting");
  const pitcherTotals = calculateTotals(activePitchers, "pitching");

  return (
    <div className="game-stats-overlay" onClick={onClose}>
      <div className="game-stats-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t.gameTerms.gameStats}</h2>
        <table className="box-score-table">
          <thead>
            <tr>
              <th>{t.gameTerms.team}</th>
              <th>{t.stats.runsScored}</th>
              <th>{t.stats.hits}</th>
              <th>{t.stats.e}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{boxScore.awayTeam.teamName}</td>
              <td>{boxScore.awayTeam.runs}</td>
              <td>{boxScore.awayTeam.hits}</td>
              <td>{boxScore.awayTeam.errors}</td>
            </tr>
            <tr>
              <td>{boxScore.homeTeam.teamName}</td>
              <td>{boxScore.homeTeam.runs}</td>
              <td>{boxScore.homeTeam.hits}</td>
              <td>{boxScore.homeTeam.errors}</td>
            </tr>
          </tbody>
        </table>

        {/* Team Selection Toggle */}
        <div className="team-toggle">
          <button
            className={`toggle-button ${selectedTeam === "away" ? "active" : ""}`}
            onClick={() => setSelectedTeam("away")}
          >
            {gameStats.boxScore.awayTeam.teamName}
          </button>
          <button
            className={`toggle-button ${selectedTeam === "home" ? "active" : ""}`}
            onClick={() => setSelectedTeam("home")}
          >
            {gameStats.boxScore.homeTeam.teamName}
          </button>
        </div>

        <h3>{t.gameTerms.hitters}</h3>
        <table className="player-stats-table">
          <thead>
            <tr>
              <th>{t.gameTerms.player}</th>
              <th>{t.stats.atBats}</th>
              <th>{t.stats.hits}</th>
              <th>{t.stats.runs}</th>
              <th>{t.stats.rbi}</th>
              <th>{t.stats["2b"]}</th>
              <th>{t.stats["3b"]}</th>
              <th>{t.stats.hr}</th>
              <th>{t.stats.k}</th>
              <th>{t.stats.bb}</th>
            </tr>
          </thead>
          <tbody>
            {activeHitters.map((player) => {
              const stats = JSON.parse(player.hitting || "{}");
              return (
                <tr key={player.player_id}>
                  <td>{player.player_name}</td>
                  <td>{stats.atBats || 0}</td>
                  <td>{stats.hits || 0}</td>
                  <td>{stats.runs || 0}</td>
                  <td>{stats.rbi || 0}</td>
                  <td>{stats.doubles || 0}</td>
                  <td>{stats.triples || 0}</td>
                  <td>{stats.homeRuns || 0}</td>
                  <td>{stats.strikeOuts || 0}</td>
                  <td>{stats.baseOnBalls || 0}</td>
                </tr>
              );
            })}
            <tr className="totals-row">
              <td><strong>Total</strong></td>
              <td>{hitterTotals.atBats || 0}</td>
              <td>{hitterTotals.hits || 0}</td>
              <td>{hitterTotals.runs || 0}</td>
              <td>{hitterTotals.rbi || 0}</td>
              <td>{hitterTotals.doubles || 0}</td>
              <td>{hitterTotals.triples || 0}</td>
              <td>{hitterTotals.homeRuns || 0}</td>
              <td>{hitterTotals.strikeOuts || 0}</td>
              <td>{hitterTotals.baseOnBalls || 0}</td>
            </tr>
          </tbody>
        </table>
        
        <h3>{t.gameTerms.pitchers}</h3>
        <table className="player-stats-table">
          <thead>
            <tr>
              <th>{t.gameTerms.player}</th>
              <th>{t.stats.ip}</th>
              <th>{t.stats.er}</th>
              <th>{t.stats.hits}</th>
              <th>{t.stats.k}</th>
              <th>{t.stats.bb}</th>
              <th>{t.stats.hr}</th>
              <th>{t.stats.pitchesThrown}</th>
            </tr>
          </thead>
          <tbody>
            {activePitchers.map((player) => {
              const stats = JSON.parse(player.pitching || "{}");
              return (
                <tr key={player.player_id}>
                  <td>{player.player_name}</td>
                  <td>{stats.inningsPitched || "0.0"}</td>
                  <td>{stats.earnedRuns || 0}</td>
                  <td>{stats.hits || 0}</td>
                  <td>{stats.strikeOuts || 0}</td>
                  <td>{stats.baseOnBalls || 0}</td>
                  <td>{stats.homeRuns || 0}</td>
                  <td>{stats.pitchesThrown || 0}</td>
                </tr>
              );
            })}
            <tr className="totals-row">
              <td><strong>Total</strong></td>
              <td>{Number(pitcherTotals.inningsPitched || 0).toFixed(1)}</td>
              <td>{pitcherTotals.earnedRuns || 0}</td>
              <td>{pitcherTotals.hits || 0}</td>
              <td>{pitcherTotals.strikeOuts || 0}</td>
              <td>{pitcherTotals.baseOnBalls || 0}</td>
              <td>{pitcherTotals.homeRuns || 0}</td>
              <td>{pitcherTotals.pitchesThrown || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamGameStatsModal;
