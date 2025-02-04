import React, { useState, useEffect, useCallback } from "react";
import { Translations } from "./constants/Translations";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../components/NotificationProvider";
import "./styles/PlayerArticles.css";

interface Article {
  id: number;
  title: string;
  summary: string[];
  link?: string;
}

interface PlayerArticlesProps {
  playerName: string;
  language: string;
  playerNameEn: string;
}

const PlayerArticles: React.FC<PlayerArticlesProps> = ({ playerName, language, playerNameEn }) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [challenge, setChallenge] = useState<{ completed: boolean; description: string }>({
    completed: false,
    description: "Complete this challenge",
  });

  const t = Translations[language] || Translations.en;

  const ARTICLES_API = import.meta.env.VITE_FETCH_ARTICLES_API_URL;
  const FETCH_CHALLENGE_API = import.meta.env.VITE_FETCH_CHALLENGE_API_URL;
  const SET_CHALLENGE_API = import.meta.env.VITE_SET_CHALLENGE_STATUS_API_URL;

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(ARTICLES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: playerNameEn.toLowerCase(),
          language: language,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data: Article[] = await response.json();
      setArticles(data);
    } catch (err) {
      setError(t.actions.error);
    } finally {
      setLoading(false);
    }
  }, [ARTICLES_API, playerNameEn, language, t]);

  const fetchChallengeStatus = useCallback(async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(FETCH_CHALLENGE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          challengeId: "news_read_article",
          language: language,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch challenge status.");

      const data = await response.json();
      setChallenge({
        completed: data.status?.completed || false,
        description: data.description || "Complete this challenge",
      });
    } catch {
      setError(t.actions.error);
    }
  }, [FETCH_CHALLENGE_API, currentUser, language, t]);

  useEffect(() => {
    fetchArticles();
    if (currentUser) fetchChallengeStatus();
  }, [fetchArticles, fetchChallengeStatus, currentUser]);

  const handleExpandArticle = useCallback(
    async (articleId: number) => {
      setExpandedArticles((prev) => {
        const newSet = new Set(prev);
        newSet.has(articleId) ? newSet.delete(articleId) : newSet.add(articleId);
        return newSet;
      });

      if (!currentUser || challenge.completed) return;

      try {
        const response = await fetch(SET_CHALLENGE_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.uid,
            challengeId: "news_read_article",
            action: "completed",
          }),
        });

        if (!response.ok) throw new Error("Failed to update challenge status.");

        setChallenge((prev) => ({ ...prev, completed: true }));
        addNotification("success", `${t.rewards.completed} ${challenge.description}`);
      } catch {
        setError(t.actions.error);
      }
    },
    [SET_CHALLENGE_API, currentUser, challenge, addNotification, t]
  );

  return (
    <div className="player-articles">
      {loading ? (
        <p>{t.actions.loading}</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : articles.length === 0 ? (
        <div className="no-articles-message">{t.actions.noArticles}</div>
      ) : (
        <div className="article-list">
          {articles.map((article) => (
            <div
              key={article.id}
              className={`article-card ${expandedArticles.has(article.id) ? "expanded" : ""}`}
              onClick={() => handleExpandArticle(article.id)}
            >
              <h3 className="article-title">{article.title}</h3>
              {expandedArticles.has(article.id) && (
                <div className="article-details">
                  <div className="article-summary">
                    {article.summary.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                  {article.link && (
                    <a className="read-more-link" href={article.link} target="_blank" rel="noopener noreferrer">
                      {t.actions.readMore}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlayerArticles;
