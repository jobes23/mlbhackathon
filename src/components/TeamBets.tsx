import React, { useState, useEffect } from "react";
import "./styles/Bets.css";
import { Translations } from "./constants/Translations";

// Interface for the odds structure, handling both single values and Over/Under objects
interface Odds {
  DraftKings: string | { Over: string; Under: string } | null;
  FanDuel: string | { Over: string; Under: string } | null;
  BetMGM: string | { Over: string; Under: string } | null;
}

// Interface for a single bet
interface Bet {
  bet_label: string;
  odds: Odds;
}

// Interface for the props passed to the TeamBets component
interface TeamBetsProps {
  teamName: string;
  language: string;
}

const API_TEAM_BETS_URL = import.meta.env.VITE_FETCH_TEAM_BETS_API_URL;

const TeamBets: React.FC<TeamBetsProps> = ({ teamName, language }) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const t = Translations[language];

  // API Helper Function
  const apiCall = async (url: string, body: object) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed request: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error("API Error:", err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchTeamBets = async () => {
      setLoading(true);
      setError(null);
      setBets([]);

      try {
        const data = await apiCall(API_TEAM_BETS_URL, { teamName, language });

        if (!data || !data.bets || !Array.isArray(data.bets)) {
          setError(t.actions.noBets);
          return;
        }

        const processedBets = data.bets.map((bet: Bet) => ({
          bet_label: bet.bet_label,
          odds: {
            DraftKings: bet.odds.DraftKings || null,
            FanDuel: bet.odds.FanDuel || null,
            BetMGM: bet.odds.BetMGM || null,
          },
        }));

        setBets(processedBets);
      } catch (err) {
        setError(t.actions.error);
      } finally {
        setLoading(false);
      }
    };

    if (teamName) {
      fetchTeamBets();
    }
  }, [teamName, language]);

  if (loading) {
    return <div className="team-bets">{t.actions.loading}</div>;
  }

  if (error) {
    return <div className="team-bets error">{error}</div>;
  }

  return (
    <div className="player-bets">
      {/* Header Row */}
      <div className="partners-header">
        <div className="header-column"></div> {/* Empty for alignment */}
        <div className="header-column">DraftKings</div>
        <div className="header-column">FanDuel</div>
        <div className="header-column">BetMGM</div>
      </div>

      {/* Bet Rows */}
      {bets.length === 0 ? (
        <div className="no-bets-message">{t.actions.noBets}</div>
      ) : (
        bets.map((bet, index) => (
          <div key={index} className="bet-row">
            <div className="bet-description">{bet.bet_label}</div>
            <div className="bet-options-grid">
              {/* DraftKings Odds */}
              {typeof bet.odds.DraftKings === "object" &&
              bet.odds.DraftKings !== null ? (
                <>
                  <button className="bet-option">
                    <span>Over</span>
                    <span>{bet.odds.DraftKings.Over}</span>
                  </button>
                  <button className="bet-option">
                    <span>Under</span>
                    <span>{bet.odds.DraftKings.Under}</span>
                  </button>
                </>
              ) : (
                <button className="bet-option">
                  {bet.odds.DraftKings || "N/A"}
                </button>
              )}

              {/* FanDuel Odds */}
              {typeof bet.odds.FanDuel === "object" &&
              bet.odds.FanDuel !== null ? (
                <>
                  <button className="bet-option">
                    <span>Over</span>
                    <span>{bet.odds.FanDuel.Over}</span>
                  </button>
                  <button className="bet-option">
                    <span>Under</span>
                    <span>{bet.odds.FanDuel.Under}</span>
                  </button>
                </>
              ) : (
                <button className="bet-option">
                  {bet.odds.FanDuel || "N/A"}
                </button>
              )}

              {/* BetMGM Odds */}
              {typeof bet.odds.BetMGM === "object" &&
              bet.odds.BetMGM !== null ? (
                <>
                  <button className="bet-option">
                    <span>Over</span>
                    <span>{bet.odds.BetMGM.Over}</span>
                  </button>
                  <button className="bet-option">
                    <span>Under</span>
                    <span>{bet.odds.BetMGM.Under}</span>
                  </button>
                </>
              ) : (
                <button className="bet-option">
                  {bet.odds.BetMGM || "N/A"}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TeamBets;
