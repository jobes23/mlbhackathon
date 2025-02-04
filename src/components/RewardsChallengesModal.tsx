import React, { useState, useEffect } from "react";
import { useNotification } from "../components/NotificationProvider";
import RewardCard from "./RewardCard";
import ChallengeCard from "./ChallengeCard";
import { Translations } from "./constants/Translations";
import "./styles/RewardsChallengesModal.css";

const API_BASE_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;

interface Challenge {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: string;
  status: {
    completed: boolean;
    redeemed: boolean;
  };
}

interface Reward {
  id: string;
  description: string;
  cost: number;
  code?: string;
}

interface RewardsChallengesModalProps {
  userId: string;
  language: string;
  userPoints: number;
  setUserPoints: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
}

const RewardsChallengesModal: React.FC<RewardsChallengesModalProps> = ({
  userId,
  language,
  userPoints,
  setUserPoints,
  onClose,
}) => {
  const { addNotification } = useNotification();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activeTab, setActiveTab] = useState<"challenges" | "rewards">("challenges");
  const t = Translations[language];

  const apiCall = async (endpoint: string, body: object) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
        body: JSON.stringify(body),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${endpoint} - ${response.status}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error(`Error calling API ${endpoint}:`, error);
      throw error;
    }
  };  

  useEffect(() => {
    if (!userId) return;

    const fetchChallengesAndRewards = async () => {
      try {
        const data = await apiCall("fetchuserchallengesandrewards", { userId, language });
        setChallenges(data.challenges || []);
        setRewards(data.rewards ? sortRewards(data.rewards) : []);
      } catch (error) {
        addNotification("error", t.rewards.challengefailed);
      }
    };

    fetchChallengesAndRewards();
  }, [userId, language]);

  const sortRewards = (rewards: Reward[]) => {
    return rewards.sort((a, b) => (a.code && !b.code ? -1 : !a.code && b.code ? 1 : 0));
  };

  const handleRewardRedeem = async (rewardId: string, pointsRequired: number, rewardDescription: string) => {
    try {
      const data = await apiCall("setrewards", {
        userId,
        rewardId,
        rewardDescription,
        action: "redeemed",
      });
  
      addNotification("success", data.message || "Reward redeemed successfully!");
  
      // Correct way to update state with previous value
      setUserPoints((prevPoints) => prevPoints - pointsRequired);
  
      // Update rewards list to reflect redeemed status
      setRewards((prevRewards) =>
        prevRewards
          .map((reward) =>
            reward.id === rewardId ? { ...reward, code: data.rewards?.[rewardId] || "" } : reward
          )
          .sort((a, b) => (a.code && !b.code ? -1 : !a.code && b.code ? 1 : 0)) // Sort redeemed rewards
      );
    } catch (error) {
      addNotification("error", "Failed to redeem reward.");
    }
  };  

  const handleChallengeClick = async (challengeId: string, points: number) => {
    try {
      const data = await apiCall("setchallengestatus", {
        userId: userId,
        challengeId: challengeId,
        action: "redeemed",
      });
  
      addNotification("success", data.message || t.rewards.challengecompleted);
  
      // Correct way to update state with previous value
      setUserPoints((prevPoints) => prevPoints + points);
  
      // Update challenge list to mark as redeemed
      setChallenges((prevChallenges) =>
        prevChallenges.map((challenge) =>
          challenge.id === challengeId
            ? { ...challenge, status: { ...challenge.status, redeemed: true } }
            : challenge
        )
      );
    } catch (error) {
      addNotification("error", t.rewards.challengefailed);
    }
  };  

  return (
    <div className="rcModal-overlay">
      <div className="rcModal-content">
        <button className="rcClose-btn" onClick={onClose}>×</button>
        <div className="rcTabs">
          <button className={activeTab === "challenges" ? "active" : ""} onClick={() => setActiveTab("challenges")}>
            {t.rewards.challenges}
          </button>
          <button className={activeTab === "rewards" ? "active" : ""} onClick={() => setActiveTab("rewards")}>
            {t.rewards.rewards}
          </button>
        </div>

        {activeTab === "challenges" ? (
          <div className="challenge-grid">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} language={language} challenge={challenge} onPerform={() => handleChallengeClick(challenge.id, challenge.points)} />
            ))}
          </div>
        ) : (
          <div className="challenge-grid">
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                userPoints={userPoints}
                language={language}
                onRedeem={() => handleRewardRedeem(reward.id, reward.cost, reward.description)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsChallengesModal;
