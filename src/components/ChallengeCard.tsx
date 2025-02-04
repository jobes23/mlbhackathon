import React, { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faUsers,
  faUserCheck,
  faNewspaper,
  faPlayCircle,
  faCoins,
  faGift,
  faCalendarCheck,
  faCommentDots,
  faTrophy,
  faQuestionCircle, // Fallback icon
} from "@fortawesome/free-solid-svg-icons";
import { Translations } from "./constants/Translations";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

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

interface ChallengeCardProps {
  challenge: Challenge;
  language: string;
  onPerform: (challengeId: string) => void;
}

const iconMap: Record<string, IconDefinition> = {
  "user-plus": faUserPlus,
  "users": faUsers,
  "user-check": faUserCheck,
  "newspaper": faNewspaper,
  "play-circle": faPlayCircle,
  "coins": faCoins,
  "gift": faGift,
  "calendar-check": faCalendarCheck,
  "comment-dots": faCommentDots,
  "trophy": faTrophy,
};

const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, language, onPerform }) => {
  const t = useMemo(() => Translations[language] || Translations.en, [language]);

  const icon = iconMap[challenge.icon] || faQuestionCircle;

  return (
    <div className="challenge-card">
      <FontAwesomeIcon icon={icon} className="challenge-icon" />
      <h4>{challenge.name}</h4>
      <p>{challenge.description}</p>

      {challenge.status.redeemed ? (
        <button className="challenge-btn disabled" disabled>
          {t.rewards.redeemed}
        </button>
      ) : challenge.status.completed ? (
        <button className="challenge-btn" onClick={() => onPerform(challenge.id)}>
          {challenge.points} {t.rewards.points}
        </button>
      ) : (
        <button className="challenge-btn disabled" disabled>
          {challenge.points} {t.rewards.points}
        </button>
      )}
    </div>
  );
};

export default ChallengeCard;
