import React, { useState, useMemo } from "react";
import "./styles/MLBRules.css";
import { Translations } from "./constants/Translations";
import { GameRulesProps } from "./types/InterfaceTypes";

const GameRules: React.FC<GameRulesProps> = ({ language }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const t = Translations[language] || Translations.en;

  const slides = useMemo(() => [
    {
      title: t.gameRulesAndStrategy.gameRulesAndStrategy,
      description: t.gameRulesAndStrategy.utbCopy,
      content: [
        { label: t.gameRules.inningsLabel, description: t.gameRules.inningsDescription },
        { label: t.gameRules.extraInningsLabel, description: t.gameRules.extraInningsDescription },
        { label: t.gameRules.strikesLabel, description: t.gameRules.strikesDescription },
        { label: t.gameRules.ballsLabel, description: t.gameRules.ballsDescription },
        { label: t.gameRules.walkLabel, description: t.gameRules.walkDescription },
        { label: t.gameRules.outsLabel, description: t.gameRules.outsDescription }, 
        { label: t.gameRules.hitByPitchLabel, description: t.gameRules.hitByPitchDescription },
        { label: t.gameRules.foulBallLabel, description: t.gameRules.foulBallDescription },
        { label: t.gameRules.infieldFlyRuleLabel, description: t.gameRules.infieldFlyRuleDescription },
        { label: t.gameRules.fairFoulBallsLabel, description: t.gameRules.fairFoulBallsDescription },
        { label: t.gameRules.baseLabel, description: t.gameRules.baseDescription },
        { label: t.gameRules.homePlateLabel, description: t.gameRules.homePlateDescription },
        { label: t.gameRules.basesLoadedLabel, description: t.gameRules.basesLoadedDescription },
        { label: t.gameRules.atBatLabel, description: t.gameRules.atBatDescription },
        { label: t.gameRules.baseRunningLabel, description: t.gameRules.baseRunningDescription },
        { label: t.gameRules.groundRuleDoubleLabel, description: t.gameRules.groundRuleDoubleDescription },
        { label: t.gameRules.doublePlaysLabel, description: t.gameRules.doublePlaysDescription },
        { label: t.gameRules.walkOffLabel, description: t.gameRules.walkOffDescription }
      ]      
    },
    {
      title: t.gameRulesAndStrategy.fieldLocations,
      description: t.gameRulesAndStrategy.fieldLocationsCopy,
      content: [
        { label: t.fieldLocations.dugoutLabel, description: t.fieldLocations.dugoutDescription },
        { label: t.fieldLocations.bullpenLabel, description: t.fieldLocations.bullpenDescription },
        { label: t.fieldLocations.warningTrackLabel, description: t.fieldLocations.warningTrackDescription },
        { label: t.fieldLocations.pitchersMoundLabel, description: t.fieldLocations.pitchersMoundDescription },
        { label: t.fieldLocations.battersBoxLabel, description: t.fieldLocations.battersBoxDescription },
        { label: t.fieldLocations.onDeckCircleLabel, description: t.fieldLocations.onDeckCircleDescription }
      ],
    },
    {
      title: t.gameRulesAndStrategy.playerPositionsAndRoles,
      description: t.gameRulesAndStrategy.positionsCopy,
      content: [
        { label: t.playerPositions.catcherLabel, description: t.playerPositions.catcherDescription },
        { label: t.playerPositions.pitcherLabel, description: t.playerPositions.pitcherDescription },
        { label: t.playerPositions.firstBasemanLabel, description: t.playerPositions.firstBasemanDescription },
        { label: t.playerPositions.secondBasemanLabel, description: t.playerPositions.secondBasemanDescription },
        { label: t.playerPositions.shortstopLabel, description: t.playerPositions.shortstopDescription },
        { label: t.playerPositions.thirdBasemanLabel, description: t.playerPositions.thirdBasemanDescription },
        { label: t.playerPositions.leftFielderLabel, description: t.playerPositions.leftFielderDescription },
        { label: t.playerPositions.centerFielderLabel, description: t.playerPositions.centerFielderDescription },
        { label: t.playerPositions.rightFielderLabel, description: t.playerPositions.rightFielderDescription }
      ],
    },
    {
      title: t.gameRulesAndStrategy.pitcherRoles,
      description: t.gameRulesAndStrategy.pitcherRolesCopy,
      content: [
        { label: t.pitcherRoles.startingPitcherLabel, description: t.pitcherRoles.startingPitcherDescription },
        { label: t.pitcherRoles.reliefPitcherLabel, description: t.pitcherRoles.reliefPitcherDescription },
        { label: t.pitcherRoles.closerLabel, description: t.pitcherRoles.closerDescription },
        { label: t.pitcherRoles.setupPitcherLabel, description: t.pitcherRoles.setupPitcherDescription },
        { label: t.pitcherRoles.longRelieverLabel, description: t.pitcherRoles.longRelieverDescription },
        { label: t.pitcherRoles.middleRelieverLabel, description: t.pitcherRoles.middleRelieverDescription }
      ],
    },
    {
      title: t.gameRulesAndStrategy.pitchTypes,
      description: t.gameRulesAndStrategy.pitchTypesCopy,
      content: [
        { label: t.pitchTypes.fastballLabel, description: t.pitchTypes.fastballDescription },
        { label: t.pitchTypes.curveballLabel, description: t.pitchTypes.curveballDescription },
        { label: t.pitchTypes.sliderLabel, description: t.pitchTypes.sliderDescription },
        { label: t.pitchTypes.changeupLabel, description: t.pitchTypes.changeupDescription },
        { label: t.pitchTypes.knuckleballLabel, description: t.pitchTypes.knuckleballDescription },
        { label: t.pitchTypes.cutterLabel, description: t.pitchTypes.cutterDescription },
        { label: t.pitchTypes.sinkerLabel, description: t.pitchTypes.sinkerDescription }
      ],
    },
    {
      title: t.gameRulesAndStrategy.advancedBaseballTerms,
      description: t.gameRulesAndStrategy.abtCopy,
      content: [
        { label: t.advancedStats.whipLabel, description: t.advancedStats.whipDescription },
        { label: t.advancedStats.obpLabel, description: t.advancedStats.obpDescription },
        { label: t.advancedStats.opsLabel, description: t.advancedStats.opsDescription }
      ]
    },
    {
      title: t.gameRulesAndStrategy.strangeRulesLabel,
      description: t.gameRulesAndStrategy.strangeRulesDescription,
      content: [
        { label: t.strangeRules.lodgedBallLabel, description: t.strangeRules.lodgedBallDescription },
        { label: t.strangeRules.bullpenRestrictionsLabel, description: t.strangeRules.bullpenRestrictionsDescription },
        { label: t.strangeRules.runnerHitByFairBallLabel, description: t.strangeRules.runnerHitByFairBallDescription },
        { label: t.strangeRules.ejectedPersonnelLabel, description: t.strangeRules.ejectedPersonnelDescription },
        { label: t.strangeRules.deflectedFairBallLabel, description: t.strangeRules.deflectedFairBallDescription },
        { label: t.strangeRules.pinchHitStrikeoutLabel, description: t.strangeRules.pinchHitStrikeoutDescription },
        { label: t.strangeRules.wetWeatherRosinLabel, description: t.strangeRules.wetWeatherRosinDescription },
        { label: t.strangeRules.detachedEquipmentLabel, description: t.strangeRules.detachedEquipmentDescription },
        { label: t.strangeRules.stealingHomeLabel, description: t.strangeRules.stealingHomeDescription },
        { label: t.strangeRules.switchingThrowingArmLabel, description: t.strangeRules.switchingThrowingArmDescription },
        { label: t.strangeRules.droppedThirdStrikeLabel, description: t.strangeRules.droppedThirdStrikeDescription },
        { label: t.strangeRules.saveRulesLabel, description: t.strangeRules.saveRulesDescription },
        { label: t.strangeRules.interferenceLabel, description: t.strangeRules.interferenceDescription }
      ]
    } 
  ], [t]);

  const handleNextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide((prev) => prev + 1);
  };

  const handlePrevSlide = () => {
    if (currentSlide > 0) setCurrentSlide((prev) => prev - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") handleNextSlide();
    if (e.key === "ArrowLeft") handlePrevSlide();
  };

  const { title, description, content } = slides[currentSlide];

  return (
    <div className="game-rules-container" tabIndex={0} onKeyDown={handleKeyDown}>
      <h1 className="section-title">{title}</h1>
      <p className="slide-description">{description}</p>

      <div className="scrollable-content">
        {content.map((item, index) => (
          <div key={index} className="rule-item">
            <p><strong>{item.label}</strong>: {item.description}</p>
          </div>
        ))}
      </div>

      <div className="navigation-buttons">
        <button onClick={handlePrevSlide} disabled={currentSlide === 0} aria-label="Previous Slide">
          {t.actions.previous || "Previous"}
        </button>
        <button onClick={handleNextSlide} disabled={currentSlide === slides.length - 1} aria-label="Next Slide">
          {t.actions.next || "Next"}
        </button>
      </div>
    </div>
  );
};

export default GameRules;
