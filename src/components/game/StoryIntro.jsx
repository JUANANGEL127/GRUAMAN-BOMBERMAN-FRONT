import { useState, useEffect, useRef } from "react";
import { getCharacterName } from "../../config/gameConfig";
import { buildStoryIntroDialogs } from "./storyIntroTiming";
import "./StoryIntro.css";

const TYPEWRITER_SPEED = 50; // ms per character
const DIALOG_PAUSE = 1600; // pause after each completed dialog

/**
 * StoryIntro — cinematic intro with a typewriter dialog sequence.
 *
 * Props:
 *   character  string  — 'bomberman' | 'gruaman'
 *   obraName   string  — selected project name
 *   onComplete fn      — callback after the full dialog sequence ends
 */
function StoryIntro({ character = "bomberman", obraName = "la obra", onComplete }) {
  const characterName = getCharacterName(character);
  const dialogs = buildStoryIntroDialogs(characterName, obraName);

  const [dialogIndex, setDialogIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [imgError, setImgError] = useState(false);

  const onCompleteRef = useRef(onComplete);
  const typeIntervalRef = useRef(null);
  const autoTimerRef = useRef(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const clearAll = () => {
    clearInterval(typeIntervalRef.current);
    clearTimeout(autoTimerRef.current);
  };

  const handleSkip = () => {
    clearAll();
    onCompleteRef.current?.();
  };

  useEffect(() => {
    clearAll();
    setDisplayedText("");
    setIsTyping(true);

    let currentCharacterIndex = 0;
    const currentDialog = dialogs[dialogIndex];

    typeIntervalRef.current = setInterval(() => {
      currentCharacterIndex += 1;
      setDisplayedText(currentDialog.slice(0, currentCharacterIndex));

      if (currentCharacterIndex >= currentDialog.length) {
        clearInterval(typeIntervalRef.current);
        setIsTyping(false);

        autoTimerRef.current = setTimeout(() => {
          if (dialogIndex < dialogs.length - 1) {
            setDialogIndex((previousDialogIndex) => previousDialogIndex + 1);
          } else {
            onCompleteRef.current?.();
          }
        }, DIALOG_PAUSE);
      }
    }, TYPEWRITER_SPEED);

    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogIndex]);

  const characterEmoji = character === "gruaman" ? "🏗️" : "💧";

  return (
    <div className="si-overlay">
      <div className="si-bg" />

      <div className="si-skip-wrap">
        <span className="si-skip-label">Saltar intro</span>
        <button className="si-skip" onClick={handleSkip} aria-label="Saltar introducción">
          <span className="si-skip-arrows">»</span>
        </button>
      </div>

      <div className="si-character">
        {!imgError ? (
          <img
            src={`/assets/${character}-idle.png`}
            alt={characterName}
            className="si-character-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="si-character-emoji" aria-hidden="true">
            {characterEmoji}
          </div>
        )}
      </div>

      <div className="si-bubble-wrap">
        <div className="si-bubble">
          <p className="si-text">
            {displayedText}
            {isTyping && <span className="si-cursor" aria-hidden="true" />}
          </p>
        </div>
        <div className="si-tail" aria-hidden="true" />
      </div>

      <div className="si-dots" role="status" aria-label={`Diálogo ${dialogIndex + 1} de ${dialogs.length}`}>
        {dialogs.map((_, index) => (
          <span
            key={index}
            className={[
              "si-dot",
              index === dialogIndex ? "si-dot--active" : "",
              index < dialogIndex ? "si-dot--done" : "",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

export default StoryIntro;
