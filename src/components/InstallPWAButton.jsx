import React, { useEffect, useState } from "react";

function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setVisible(false);
    }
  };

  if (!visible) return null;

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
