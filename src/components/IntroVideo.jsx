import React, { useState } from "react";

// Usa variable de entorno para la base de la API (por si se usa en el futuro)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

function IntroVideo({ onVideoEnd }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const handleVideoEnd = () => {
    setFadeOut(true);
    setTimeout(() => {
      setIsPlaying(false);
      onVideoEnd();
    }, 600); // Duración de la transición en ms
  };

  if (!isPlaying) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#184671",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.6s ease"
      }}
    >
      <video
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        style={{
          maxWidth: "100vw",
          maxHeight: "100vh",
          width: "auto",
          height: "100vh",
          objectFit: "contain",
          background: "#184671", // Cambia el fondo del video también
          borderRadius: 0
        }}
      >
        {/* Si el video estuviera en la API, usar: 
        <source src={`${API_BASE_URL}/intro.mp4`} type="video/mp4" /> 
        */}
        <source src="/intro.mp4" type="video/mp4" />
        Tu navegador no soporta el elemento de video.
      </video>
    </div>
  );
}

export default IntroVideo;
