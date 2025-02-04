import { useState, useEffect, useMemo } from "react";
import { Favorites, PlayerStats, TeamStats } from "../types/InterfaceTypes";

export const useFetchFavorites = (
  favorites: Favorites,
  selectedLanguage: string,
  t: any
): { playerStats: PlayerStats[]; teamStats: TeamStats[]; loading: boolean } => {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const memoizedPlayers = useMemo(() => favorites.players || [], [favorites.players]);
  const memoizedTeams = useMemo(() => favorites.teams || [], [favorites.teams]);

  useEffect(() => {
    const fetchPlayerStats = async () => {
      if (memoizedPlayers.length === 0) {
        setPlayerStats([]);
        return;
      }

      try {
        const response = await fetch(import.meta.env.VITE_FETCH_PLAYER_STATS_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player_id: memoizedPlayers,
            language: selectedLanguage,
            statType: "top_4_stats",
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch player stats");
        const data = await response.json();

        if (!data || !data.data) throw new Error("Invalid player stats response");

        const fetchedPlayerStats = data.data.map((player: any) => ({
          id: player.player_id || "Unknown",
          name: player.player_name || "N/A",
          name_en: player.player_name_en || player.player_name || "N/A",
          teamName: player.team || "N/A",
          position: player.position || "Unknown",
          imageUrl: `https://midfield.mlbstatic.com/v1/people/${player.player_id || 0}/spots/120`,
          topStats: player.top_4_stats || [],
          lastGameSummary: player.last_game_summary || "No summary available",
        }));
        setPlayerStats(fetchedPlayerStats);
      } catch (error) {
        setPlayerStats([]);
        setLoading(false); // Stop loading to avoid infinite spinner
      }
    };

    const fetchTeamStats = async () => {
      if (memoizedTeams.length === 0) {
        setTeamStats([]);
        return;
      }

      try {
        const response = await fetch(import.meta.env.VITE_FETCH_TEAM_STATS_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team_ids: memoizedTeams,
            language: selectedLanguage,
          }),
        });

        if (!response.ok) throw new Error("Failed to fetch team stats");
        const data = await response.json();

        if (!data || !data.teams) throw new Error("Invalid team stats response");

        const fetchedTeamStats = data.teams.map((team: any) => ({
          id: team.team_id,
          name: team.team_name,
          name_en: team.team_name_en || team.team_name,
          logoUrl: `https://www.mlbstatic.com/team-logos/${team.team_id}.svg`,
          winLoss: team.stats?.win_loss || "N/A",
          divisionWinLoss: team.stats?.division_win_loss || "N/A",
          hr: team.stats?.hitting_homeruns || 0,
          runsScored: team.stats?.hitting_runs || 0,
          lastGame: team.last_game || "No game data",
          nextGame: team.next_game || "No game data",
        }));
        setTeamStats(fetchedTeamStats);
      } catch (error) {
        setTeamStats([]);
        setLoading(false); // Stop loading to avoid infinite spinner
      }
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchPlayerStats(), fetchTeamStats()]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [memoizedPlayers, memoizedTeams, selectedLanguage, t]);

  return { playerStats, teamStats, loading };
};
