import React, { useState, useEffect } from "react";
import { Translations } from "./constants/Translations";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../components/NotificationProvider";
import "./styles/PlayerArticles.css";

interface TeamArticlesProps {
  teamName: string;
  language: string;
  teamNameEn: string;
}

const API_ARTICLES_URL = import.meta.env.VITE_FETCH_ARTICLES_API_URL;
const API_CHALLENGE_STATUS_URL = import.meta.env.VITE_FETCH_CHALLENGE_API_URL;
const API_SET_CHALLENGE_URL = import.meta.env.VITE_SET_CHALLENGE_STATUS_API_URL;

const TeamArticles: React.FC<TeamArticlesProps> = ({ teamName, language, teamNameEn }) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());
  const [challenge, setChallenge] = useState<{ completed: boolean; description: string }>({
    completed: false,
    description: "Complete this challenge",
  });

  const t = Translations[language];

  // ✅ API Helper Function
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

  // ✅ Fetch Articles
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError(null);
      setArticles([]);

      try {
        const data = await apiCall(API_ARTICLES_URL, { teamName: teamNameEn, language });
        setArticles(data);
      } catch (err) {
        setError(t.actions.error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();

    if (currentUser) {
      fetchChallengeStatus();
    }
  }, [teamName, language, currentUser]);

  // ✅ Fetch Challenge Status & Description
  const fetchChallengeStatus = async () => {
    if (!currentUser) return;

    try {
      const data = await apiCall(API_CHALLENGE_STATUS_URL, {
        userId: currentUser.uid,
        challengeId: "news_read_article",
        language,
      });

      setChallenge({
        completed: data.status?.completed || false,
        description: data.description || "Complete this challenge",
      });
    } catch (error) {
      console.error("Error fetching challenge:", error);
    }
  };

  // ✅ Handle Expand Article & Mark Challenge as Completed
  const handleExpandArticle = async (articleId: number) => {
    setExpandedArticles((prev) => {
      const newSet = new Set(prev);
      newSet.has(articleId) ? newSet.delete(articleId) : newSet.add(articleId);
      return new Set(newSet);
    });

    if (!currentUser || challenge.completed) return;

    try {
      await apiCall(API_SET_CHALLENGE_URL, {
        userId: currentUser.uid,
        challengeId: "news_read_article",
        action: "completed",
      });

      setChallenge((prevState) => ({ ...prevState, completed: true }));

      addNotification("success", `${t.rewards.completed} ${challenge.description}`);
    } catch (error) {
      console.error("Error updating challenge completion:", error);
    }
  };

  return (
    <div className="player-articles">
      {loading ? (
        <div className="loading-spinner">
          <span>{t.actions.loading}</span>
        </div>
      ) : error ? (
        <div className="error-message">{t.actions.error}</div>
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
                    {article.summary.map((paragraph: string, index: number) => (
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

export default TeamArticles;
