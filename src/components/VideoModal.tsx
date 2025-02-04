import React, { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import { FaPlay, FaPause } from "react-icons/fa";
import "./styles/VideoModal.css";
import localAudio from "./assets/audiomass-output.wav";
import { Translations } from "./constants/Translations";

interface VideoModalProps {
  isOpen: boolean;
  videoData: {
    video_url: string;
    transcription: string; // SSML text if not English
    title: string;
  };
  language: string;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  videoData,
  language,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTTSPlayed, setIsTTSPlayed] = useState(false); // Prevent SSML restarting

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null); // Crowd Noise
  const ttsAudioRef = useRef<ReactPlayer | null>(null);
  const t = Translations[language] || Translations.en;

  // **Fetch TTS audio if needed (Non-English)**
  useEffect(() => {
    if (language !== "en") {
      console.log(videoData)
      fetchTTSAudio(videoData.transcription);
    }
  }, [videoData.transcription, language]);

  const fetchTTSAudio = async (ssml: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(import.meta.env.VITE_TTS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssml, language }),
      });

      const data = await response.json();
      console.log(data);
      if (data.audioContent) {
        setAudioUrl(`data:audio/mp3;base64,${data.audioContent}`);
      } else {
        console.error("TTS fetch failed:", data);
      }
    } catch (error) {
      console.error("Error fetching TTS audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // **Play/Pause Video, Background Audio, and TTS**
  const playMedia = () => {
    videoRef.current?.play();
    bgAudioRef.current?.play();
  
    if (audioUrl && !isTTSPlayed) {
      setTimeout(() => {
        ttsAudioRef.current?.getInternalPlayer()?.play();
        setIsTTSPlayed(true); // Prevent SSML from restarting
      }, 2000); // 🔹 Delay of 2000ms (2 seconds) before TTS plays
    }
  };

  const pauseMedia = () => {
    videoRef.current?.pause();
    bgAudioRef.current?.pause();
    ttsAudioRef.current?.getInternalPlayer()?.pause();
    stopTextToSpeech();
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseMedia();
    } else {
      playMedia();
    }
    setIsPlaying(!isPlaying);
  };

  const stopTextToSpeech = () => {
    speechSynthesis.cancel();
  };

  // **Ensure TTS stops when modal closes**
  useEffect(() => {
    return () => stopTextToSpeech();
  }, []);

  // **Set Background Audio Volume**
  useEffect(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = 0.2;
    }
  }, []);

  // **Stop Background Audio When Video Ends**
  const handleVideoEnd = () => {
    setIsPlaying(false);
    bgAudioRef.current?.pause();
    bgAudioRef.current!.currentTime = 0; // Reset background audio
    ttsAudioRef.current?.getInternalPlayer()?.pause();
    ttsAudioRef.current?.seekTo(0); // Reset SSML audio if needed
  };

  if (!isOpen) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{videoData.title}</h2>

        {/* Loading Indicator */}
        {isLoading && <p className="loading-indicator">{t.actions.loading}</p>}

        {/* Background Audio (Crowd Noise) */}
        <audio ref={bgAudioRef} src={localAudio} loop />

        {/* TTS Audio (If Available) */}
        {language !== "en" && audioUrl && (
          <ReactPlayer
            ref={ttsAudioRef}
            url={audioUrl}
            playing={isPlaying}
            volume={0.5}
            controls={false}
            width="0px"
            height="0px"
          />
        )}

        {/* Video Player */}
        <div className="video-container">
          <video
            ref={videoRef}
            className="video-player"
            src={videoData.video_url}
            muted={language !== "en"}
            controls={false}
            onEnded={handleVideoEnd} // Stop crowd noise & SSML when video ends
          />
          <div className="controls" onClick={handlePlayPause}>
            <button className="video-player-button">
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
          </div>
        </div>

        <button className="video-modal-close" onClick={onClose}>
          X
        </button>
      </div>
    </div>
  );
};

export default VideoModal;
