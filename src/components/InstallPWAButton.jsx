import React, { useEffect, useState } from "react";

function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Detectar cambio de tamaño para modo móvil
    const resizeHandler = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setVisible(false);
    }
  };

  if (!visible || !isMobile) return null;

  return (
    <button
      onClick={handleInstall}
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "#1976d2",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "12px 20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        fontSize: 16,
        cursor: "pointer"
      }}
    >
      Instalar App
    </button>
  );
}

export default InstallPWAButton;
