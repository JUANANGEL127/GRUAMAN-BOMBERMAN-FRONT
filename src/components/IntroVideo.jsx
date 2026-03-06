import React, { useState, useEffect, useRef } from "react";

const MAX_WAIT_MS = 6000; // si en 6s no arranca, saltar

/**
 * IntroVideo
 * Props:
 *   onVideoEnd      fn()           — el video terminó normalmente
 *   onSlowDetected  fn() optional  — el video no cargó en 6s o dio error (posible red lenta)
 */
function IntroVideo({ onVideoEnd, onSlowDetected }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [fadeOut, setFadeOut]     = useState(false);
  const escapedRef                = useRef(false);

  // slow=true → timeout/error;  slow=false → terminó normalmente
  const escape = (slow = false) => {
    if (escapedRef.current) return;
    escapedRef.current = true;
    setFadeOut(true);
    setTimeout(() => {
      setIsPlaying(false);
      onVideoEnd();
      if (slow) onSlowDetected?.();
    }, 400);
  };

  // Red demasiado lenta o sin video → saltar y avisar
  useEffect(() => {
    const timer = setTimeout(() => escape(true), MAX_WAIT_MS);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isPlaying) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0,
        width: "100vw", height: "100vh",
        backgroundColor: "#184671",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.4s ease"
      }}
    >
      <video
        autoPlay
        muted
        playsInline
        onEnded={() => escape(false)}
        onError={() => escape(true)}
        onStalled={() => escape(true)}
        style={{
          maxWidth: "100vw",
          maxHeight: "100vh",
          width: "auto",
          height: "100vh",
          objectFit: "contain",
          background: "#184671",
          borderRadius: 0
        }}
      >
        <source src="/intro.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

export default IntroVideo;
