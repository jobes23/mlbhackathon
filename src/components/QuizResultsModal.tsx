import React from "react";
import "./styles/QuizResultsModal.css";

interface QuizResultsModalProps {
  score: number;
  totalQuestions: number;
  onClose: () => void;
  t: any; // Translation object
}

const QuizResultsModal: React.FC<QuizResultsModalProps> = ({
  score,
  totalQuestions,
  onClose,
  t,
}) => {
  return (
    <div className="quiz-modal-overlay">
      <div className="quiz-modal">
        <h2>{t.quizTerms.quizCompleted}</h2>
        <p>
          {t.quizTerms.score}: {score} / {totalQuestions}
        </p>
        <p>{score / totalQuestions >= 0.7 ? t.quizTerms.greatJob : t.quizTerms.keepPracticing}</p>
        <button onClick={onClose} className="close-modal-btn">
          {t.quizTerms.finishQuiz}
        </button>
      </div>
    </div>
  );
};

export default QuizResultsModal;
