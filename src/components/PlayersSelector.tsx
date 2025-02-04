import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Player } from "./types/InterfaceTypes";
import { Translations } from "./constants/Translations";
import { debounce } from "./utils/debounce";

interface PlayersSelectorProps {
  selectedPlayers: number[];
  onSelectionChange: (updatedPlayers: number[]) => void;
  language: string;
}

const PlayersSelector: React.FC<PlayersSelectorProps> = ({
  selectedPlayers,
  onSelectionChange,
  language,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerSearch, setPlayerSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const t = Translations[language] || Translations.en;

  const API_URL = import.meta.env.VITE_FETCH_MLB_DATA_API_URL;
  console.log(API_URL)

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const allPlayers: Player[] = data.players.map((player: any) => ({
          id: player.player_id,
          name: player.name,
          position: player.position,
          teamName: player.team_name,
          name_en: player.name_en,
        }));

        setPlayers(allPlayers);
      } catch (error) {
        console.error("Failed to fetch players:", error);
        setError(`Failed to load players. Please try again.`);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [API_URL, language]);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setPlayerSearch(value);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const filteredPlayers = useMemo(() => {
    return players.filter(
      (player) =>
        player.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
        player.name_en.toLowerCase().includes(playerSearch.toLowerCase())
    );
  }, [players, playerSearch]);

  const sortedPlayers = useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      const isASelected = selectedPlayers.includes(a.id);
      const isBSelected = selectedPlayers.includes(b.id);

      if (isASelected && !isBSelected) return -1;
      if (!isASelected && isBSelected) return 1;

      if (playerSearch) {
        const aMatches = a.name.toLowerCase().includes(playerSearch.toLowerCase());
        const bMatches = b.name.toLowerCase().includes(playerSearch.toLowerCase());

        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
      }

      return a.name.localeCompare(b.name);
    });
  }, [filteredPlayers, selectedPlayers, playerSearch]);

  const handlePlayerClick = (playerId: number) => {
    const updatedPlayers = selectedPlayers.includes(playerId)
      ? selectedPlayers.filter((id) => id !== playerId)
      : [...selectedPlayers, playerId];
    onSelectionChange(updatedPlayers);
  };

  return (
    <div className="player-section">
      <input
        type="text"
        placeholder={t.players.searchPlayers}
        onChange={handleSearchChange}
        className="player-search"
        aria-label="Search players"
        aria-live="polite"
      />

      {loading ? (
        <div aria-live="polite">{t.actions.loading}</div>
      ) : error ? (
        <div className="error">
          {error}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : (
        <div className="player-list">
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              className={`player-item ${selectedPlayers.includes(player.id) ? "selected" : ""}`}
              onClick={() => handlePlayerClick(player.id)}
            >
              <img
                src={`https://midfield.mlbstatic.com/v1/people/${player.id}/spots/120`}
                alt={player.name}
                className="player-headshot"
                loading="lazy"
              />
              <div className="player-info">
                <strong>{player.name}</strong>
                <span>{player.teamName}</span>
                <span>{player.position}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayersSelector;
