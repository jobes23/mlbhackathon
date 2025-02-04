import React from "react";
import { Translations } from "./constants/Translations";
import { FaCoins } from "react-icons/fa";

interface Reward {
  id: string;
  description: string;
  cost: number;
  code?: string; // Ensure code is optional
}

interface RewardCardProps {
  reward: Reward; // Match prop name correctly
  userPoints: number;
  onRedeem: (rewardId: string, pointsRequired: number, rewardDescription: string) => void;
  language: string;
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, userPoints, onRedeem, language }) => {
  if (!reward) {
    return <p>Error: Reward data is missing</p>;
  }

  const t = Translations[language] || Translations.en;

  return (
    <div className="reward-card">
      <div className="reward-description">
        <p className="reward-title">{reward.description}</p>
      </div>

      {!reward.code ? (
        <button
          className={`reward-btn ${userPoints < reward.cost ? "disabled" : ""}`}
          onClick={() => onRedeem(reward.id, reward.cost, reward.description)}
          disabled={userPoints < reward.cost}
        >
          {reward.cost} <FaCoins />
        </button>
      ) : (
        <p className="redeemed-text">{reward.code}</p>
      )}
    </div>
  );
};

export default RewardCard;
