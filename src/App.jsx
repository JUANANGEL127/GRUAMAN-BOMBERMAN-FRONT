import React, { useState, useEffect } from "react";
import CedulaIngreso from "./CedulaIngreso";
import BienvenidaSeleccion from "./BienvenidaSeleccion";
import "./App.css";
import InstallPWAButton from "./components/InstallPWAButton";
import IntroVideo from "./components/IntroVideo";
import SlowConnectionBanner from "./components/SlowConnectionBanner";
import { subscribeUser } from "./pushNotifications";

function App() {
  const [usuario, setUsuario] = useState(null);

  const isLiteMode = sessionStorage.getItem('lite_mode') === 'true';

  // Saltar video si el usuario ya eligió modo lite previamente
  const [showIntro,      setShowIntro]      = useState(!isLiteMode);
  const [showLiteBanner, setShowLiteBanner] = useState(false);

  const trabajadorId = usuario?.id;
  useEffect(() => {
    if (trabajadorId && 'serviceWorker' in navigator && 'PushManager' in window) {
      subscribeUser(trabajadorId)
        .then(() => console.log('Suscripción push enviada al backend'))
        .catch(err => console.error('Error al suscribirse a push', err));
    }
  }, [trabajadorId]);

  const handleIntroEnd = () => setShowIntro(false);

  // El video no cargó en 6s o dio error → conexión lenta real → sugerir lite
  const handleSlowDetected = () => {
    if (!isLiteMode) setShowLiteBanner(true);
  };

  const handleUseLite = () => {
    sessionStorage.setItem('lite_mode', 'true');
    setShowLiteBanner(false);
  };

  const handleDismissBanner = () => setShowLiteBanner(false);

  return (
    <div className="App">
      {showIntro && (
        <IntroVideo
          onVideoEnd={handleIntroEnd}
          onSlowDetected={handleSlowDetected}
        />
      )}
      {!showIntro && (
        <>
          {!usuario ? (
            <CedulaIngreso onUsuarioEncontrado={setUsuario} />
          ) : (
            <BienvenidaSeleccion usuario={usuario} />
          )}
        </>
      )}
      {showLiteBanner && (
        <SlowConnectionBanner
          onUseLite={handleUseLite}
          onDismiss={handleDismissBanner}
        />
      )}
      <InstallPWAButton />
    </div>
  );
}

// Si necesitas hacer llamadas a la API desde este archivo en el futuro, usa:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

export default App;