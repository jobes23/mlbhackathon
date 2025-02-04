import React, { useState, useEffect } from 'react';
import './styles/Bets.css';

interface TopStat {
  stat_name: string;
  stat_value: number;
}

interface Bet {
  description: string;
  odds: {
    DraftKings: string | null;
    FanDuel: string | null;
    BetMGM: string | null;
  };
}

interface PlayerBetsProps {
  topStats: TopStat[];
  language: string;
  playerName: string;
}

const PlayerBets: React.FC<PlayerBetsProps> = ({ topStats, language, playerName }) => {
  const [bets, setBets] = useState<Bet[]>([]);

  useEffect(() => {
    const processBetArray = (stats: TopStat[]): Bet[] => {
      const validStats = [
        'homeRuns_hitting_zscore',
        'rbi_hitting_zscore',
        'runs_hitting_zscore',
        'shutouts_pitching_zscore',
        'completeGames_pitching_zscore',
        'wins_pitching_zscore',
        'strikeOuts_pitching_zscore'
      ];
      
      // Filter stats based on validStats array
      const filteredStats = stats.filter(stat => validStats.includes(stat.stat_name));
    
      return filteredStats.map((stat) => {
        let description = '';
        let randomProp = Math.random() > 0.5 ? 0.5 : 1; // Randomize over/under prop
        let randomOdds = Math.floor(Math.random() * 200) + 100; // Odds range +100 to +300

        switch (stat.stat_name) {
          case 'homeRuns_hitting_zscore':
            switch (language) {
              case 'es':
                description = playerName + ' golpea un jonrón?';
                break;
              case 'ja':
                description = playerName + ' がホームランを打つ？';
                break;
              default:
                description = playerName + ' to hit a home run?';
                break;
            }
            break;
          case 'rbi_hitting_zscore':
            switch (language) {
              case 'es':
                description = playerName + ' tendrá más de 1.5 RBI?';
                break;
              case 'ja':
                description = playerName + ' は1.5以上の打点を記録しますか？';
                break;
              default:
                description = playerName + ' over 1.5 RBIs?';
                break;
            }
            break;
          case 'runs_hitting_zscore':
            switch (language) {
              case 'es':
                description = playerName + ' anotará más de 0.5 carreras?';
                break;
              case 'ja':
                description = playerName + ' は0.5以上のランを記録しますか？';
                break;
              default:
                description = playerName + ' to score over .5 runs?';
                break;
            }
            break;
          case 'shutouts_pitching_zscore':
            switch (language) {
              case 'es':
                description = playerName + ' logrará más de 7 blanque os?';
                break;
              case 'ja':
                description = playerName + ' は7以上の完封勝利を収めますか？';
                break;
              default:
                description = playerName + ' to achieve a shutout?';
                break;
            }
            break;
          case 'completeGames_pitching_zscore':
            switch (language) {
              case 'es':
                description = playerName + ' lanzará un juego completo?';
                break;
              case 'ja':
                description = playerName + ' は完投しますか？';
                break;
              default:
                description = playerName + ' to throw a complete game?';
                break;
            }
            break;
          case 'wins_pitching_zscore':
            switch (language) {
              case 'es':
                description = playerName + ' registrará una victoria?';
                break;
              case 'ja':
                description = playerName + ' は勝利を収めますか？';
                break;
              default:
                description = playerName + ' to record a win?';
                break;
            }
            break;
          case 'strikeOuts_pitching_zscore':
            switch (language) {
              case 'es':
                description = playerName + ' ponchará más de 7 bateadores?';
                break;
              case 'ja':
                description = playerName + ' は7人以上の三振を奪いますか？';
                break;
              default:
                description = playerName + ' strikeouts 7+ batters?';
                break;
            }
            break;
          default:
            description = `Will the player perform well?`;
        }

        return {
          description,
          odds: {
            DraftKings: `+${randomOdds}`,
            FanDuel: `+${randomOdds + 10}`,
            BetMGM: `+${randomOdds + 20}`,
          },
        };
      });
    };

    setBets(processBetArray(topStats));
  }, [topStats, language, playerName]);

  return (
    <div className="player-bets">
      {/* Header Row */}
      <div className="partners-header">
        <div className="header-column"></div>
        <div className="header-column">DraftKings</div>
        <div className="header-column">FanDuel</div>
        <div className="header-column">BetMGM</div>
      </div>

      {/* Bets */}
      {bets.map((bet, index) => (
        <div key={index} className="bet-row">
          <div className="bet-description">{bet.description}</div>
          <div className="bet-options-grid">
            <button className="bet-option">
              {bet.odds.DraftKings || 'N/A'}
            </button>
            <button className="bet-option">
              {bet.odds.FanDuel || 'N/A'}
            </button>
            <button className="bet-option">
              {bet.odds.BetMGM || 'N/A'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerBets;