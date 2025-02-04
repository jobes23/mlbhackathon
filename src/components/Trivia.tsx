import React, { useState, useMemo } from "react";
import "./styles/Trivia.css";
import { categorizedQuestions } from "./constants/QuizQuestions";
import { Categories } from "./constants/QuizCategories";
import { Question } from "./constants/QuizQuestions";
import { Translations } from "./constants/Translations";
import QuizResultsModal from "./QuizResultsModal";

interface QuizProps {
  selectedLanguage: string;
}

const Quiz: React.FC<QuizProps> = ({ selectedLanguage }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  const categoryTranslations = Categories[selectedLanguage] || Categories.en;
  const categoryKeys = Object.keys(categorizedQuestions.en);
  const t = Translations[selectedLanguage] || Translations.en;

  const currentCategoryQuestions: Question[] =
    selectedCategory
      ? categorizedQuestions[selectedLanguage]?.[selectedCategory] ||
        categorizedQuestions.en?.[selectedCategory] ||
        []
      : [];

  const shuffledQuestions = useMemo(() => {
    return currentCategoryQuestions.map((q) => shuffleOptions(q));
  }, [currentCategoryQuestions]);

  const currentQuestion: Question | undefined =
    shuffledQuestions.length > 0 ? shuffledQuestions[currentQuestionIndex] : undefined;

  const startQuiz = (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResults(false);
  };

  const handleOptionClick = (index: number) => {
    setSelectedOption(index);
  };

  const handleNext = () => {
    if (currentQuestion && selectedOption === currentQuestion.correctAnswer) {
      setScore((prevScore) => prevScore + 1);
    }
    setShowExplanation(true);
  };

  const goToNextQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);
    if (currentQuestionIndex + 1 < shuffledQuestions.length) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  return (
    <div className="quiz-container">
      {showResults && (
        <QuizResultsModal
          score={score}
          totalQuestions={shuffledQuestions.length}
          onClose={() => {
            setShowResults(false);
            setSelectedCategory(null);
          }}
          t={t}
        />
      )}

      {!selectedCategory ? (
        <div className="category-selection">
          <h2>{t.selectCategory}</h2>
          {categoryKeys.map((key) => (
            <button className="triviaCategories" key={key} onClick={() => startQuiz(key)}>
              {categoryTranslations[key] || key}
            </button>
          ))}
        </div>
      ) : currentQuestion ? (
        <div>
          <h2>{`${categoryTranslations[selectedCategory] || selectedCategory}`}</h2>
          <p className="question">{currentQuestion.question}</p>
          <div className="options">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option ${selectedOption === index ? "selected" : ""}`}
                onClick={() => handleOptionClick(index)}
                disabled={showExplanation}
              >
                {option}
              </button>
            ))}
          </div>
          
          {!showExplanation ? (
            <button
              className="next-btn"
              onClick={handleNext}
              disabled={selectedOption === null}
            >
              {t.quizTerms.submitAnswer}
            </button>
          ) : (
            <div className="explanation">
              <p>
                {selectedOption === currentQuestion.correctAnswer
                  ? t.quizTerms.correctAnswer
                  : t.quizTerms.wrongAnswer}
              </p>
              <p>{currentQuestion.explanation}</p>
              <button className="next-btn" onClick={goToNextQuestion}>
                {currentQuestionIndex + 1 < shuffledQuestions.length
                  ? t.quizTerms.nextQuestion
                  : t.quizTerms.finishQuiz}
              </button>
            </div>
          )}

          <div className="score">
            {t.quizTerms.score}: {score}/{shuffledQuestions.length}
          </div>
        </div>
      ) : (
        <div>{t.quizTerms.noQuestions}</div>
      )}
    </div>
  );
};

const shuffleOptions = (question: Question) => {
  const { options, correctAnswer } = question;
  const shuffled = options
    .map((option, index) => ({ option, index }))
    .sort(() => Math.random() - 0.5);

  const newOptions = shuffled.map(({ option }) => option);
  const newCorrectAnswer = shuffled.findIndex(({ index }) => index === correctAnswer);

  return { ...question, options: newOptions, correctAnswer: newCorrectAnswer };
};

export default Quiz;
