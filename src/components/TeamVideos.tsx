import React, { useState, useEffect } from "react";
import "./styles/PlayerVideos.css";
import { FaBaseballBall } from "react-icons/fa";
import { Translations } from "./constants/Translations";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../components/NotificationProvider";
import baseballField from "./assets/baseball_field.png";

interface TeamVideosProps {
  teamId: number;
  language: string;
  setModalVideo: React.Dispatch<
    React.SetStateAction<{
      video_url: string;
      transcription: string;
      title: string;
    } | null>
  >;
  setIsVideoModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface VideoData {
  video_url: string;
  transcription: string;
  hitCordinatesX: number;
  hitCordinatesY: number;
  totalDistance: number;
  title: string;
}

const API_PLAYER_VIDEOS_URL = import.meta.env.VITE_FETCH_PLAYER_VIDEOS_API_URL;
const API_FETCH_CHALLENGE_URL = import.meta.env.VITE_FETCH_CHALLENGE_API_URL;
const API_SET_CHALLENGE_STATUS_URL = import.meta.env.VITE_SET_CHALLENGE_STATUS_API_URL;

const TeamVideos: React.FC<TeamVideosProps> = ({
  teamId,
  language,
  setModalVideo,
  setIsVideoModalOpen,
}) => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [challengeCompleted, setChallengeCompleted] = useState<boolean>(false);
  const [challengeDescription, setChallengeDescription] = useState<string | undefined>(undefined);
  const [challengeTitle, setChallengeTitle] = useState<string | undefined>(undefined);
  const t = Translations[language];

  useEffect(() => {
    if (!teamId) return;

    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(API_PLAYER_VIDEOS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ team_id: teamId, language }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch team videos.");
        }

        const data = await response.json();
        setVideos(data.results || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
    if (currentUser) {
      fetchChallengeStatus();
    }
  }, [teamId, language]);

  // Fetch challenge status for media_watch_video
  const fetchChallengeStatus = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(API_FETCH_CHALLENGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          challengeId: "media_watch_video",
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch challenge status.");
      }

      const data = await response.json();
      setChallengeDescription(data.description);
      setChallengeTitle(data.name);
      setChallengeCompleted(data.completed || false);
    } catch (error) {
      console.error("Error fetching challenge:", error);
    }
  };

  // Handle video play and mark "media_watch_video" as completed
  const handleVideoClick = async (video: VideoData) => {
    setModalVideo(video);
    setIsVideoModalOpen(true);

    if (!currentUser || challengeCompleted) return;

    try {
      const response = await fetch(API_SET_CHALLENGE_STATUS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.uid,
          challengeId: "media_watch_video",
          action: "completed",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update challenge status.");
      }

      setChallengeCompleted(true);
      addNotification("success", t.rewards.completed, challengeTitle, challengeDescription);
    } catch (error) {
      console.error("Error updating challenge completion:", error);
    }
  };

  let lowestYMobile = Infinity; // Track the lowest Y value for mobile devices

  const isMobileDevice = (): boolean => {
    return /Mobi|Android/i.test(navigator.userAgent); // Detect mobile devices
  };
  const normalizeRadialCoordinate = (
    x: number,
    y: number
  ): { x: number; y: number } => {
    if (isMobileDevice()) {
      if (y !== null && y < lowestYMobile) {
        lowestYMobile = y;
      }

      // Calculate the ratio: every 3 points equals 1px, normalize relative to lowest Y
      const ratio = (y !== null ? y - lowestYMobile : 0) / 2;
      const normalizedY = 77 + ratio; // Base at 77px, adjusted by the ratio

      const normalizedX = x * 1.6; // Mobile-specific scaling
      return { x: normalizedX, y: normalizedY };
    } else {
      // Update the lowest Y value if applicable
      if (y !== null && y < lowestYMobile) {
        lowestYMobile = y;
      }
      const ratio = (y !== null ? y - lowestYMobile : 0) / 1.55;
      const normalizedY = 165 + ratio; // Base at 380, adjusted by the ratio

       // Desktop-specific logic (unchanged)
       const normalizedX = x * 2.7; // Desktop scaling factor
      return { x: normalizedX, y: normalizedY };
    }
  };

  if (loading) return <p>{t.actions.loading}</p>;
  if (error) return <p>{t.actions.error}: {error}</p>;
  if (!videos.length) return <p>{t.actions.noVideos}</p>;

  return (
    <div className="player-videos">
      <div className="baseball-field-container">
        <img
          src={baseballField}
          alt="Baseball Field"
          className="outfield-image"
        />
        {videos.map((video, index) => {
          const { x, y } = normalizeRadialCoordinate(
            video.hitCordinatesX,
            video.totalDistance
          );
          return (
            <div
              key={index}
              className="baseball-icon"
              style={{
                left: `${x}px`,
                bottom: `${y}px`,
              }}
              onClick={() => handleVideoClick(video)} // Pass video data and open modal
              onMouseEnter={() => setHoveredIndex(index)} // Set hovered index
              onMouseLeave={() => setHoveredIndex(null)} // Clear hovered index
            >
              <FaBaseballBall size={15} />
              {hoveredIndex === index && (
                <div
                  className={`tooltip ${x < 50 ? "right-side" : ""} ${
                    x > 450 ? "left-side" : ""
                  }`}
                  style={{
                    transform:
                      x < 50
                        ? "translateX(50%)" // Tooltip appears to the right
                        : x > 450
                        ? "translateX(-50%)" // Tooltip appears to the left
                        : "translateX(-50%)", // Default (centered above)
                  }}
                >
                  <p>
                    <strong>{video.title}</strong>
                  </p>
                </div>
              )}
            </div>
          );          
        })}
      </div>
    </div>
  );
};

export default TeamVideos;
