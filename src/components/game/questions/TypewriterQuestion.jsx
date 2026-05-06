import { useEffect, useRef } from 'react';
import './TypewriterQuestion.css';

/**
 * Renders question text immediately without typewriter effect.
 */
function TypewriterQuestion({ text = '', onDone }) {
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    onDoneRef.current?.();
  }, [text]);

  return <p className="tq-text">{text}</p>;
}

export default TypewriterQuestion;
