import React, { useState, useEffect } from "react";
import CedulaIngreso from "./CedulaIngreso";
import BienvenidaSeleccion from "./BienvenidaSeleccion";
import "./App.css";
import InstallPWAButton from "./components/InstallPWAButton";
import IntroVideo from "./components/IntroVideo";
import { subscribeUser } from "./pushNotifications";

/**
 * Formulario de portada y registro de datos básicos con estructura y clases compatibles con permiso_trabajo.css
 */
function App() {
  const [usuario, setUsuario] = useState(null);
  const [showIntro, setShowIntro] = useState(true);

  // Obtén el trabajadorId del usuario si está disponible
  const trabajadorId = usuario?.id; // Ajusta según la estructura real de tu usuario

  useEffect(() => {
    if (trabajadorId && 'serviceWorker' in navigator && 'PushManager' in window) {
      subscribeUser(trabajadorId)
        .then(() => console.log('Suscripción push enviada al backend'))
        .catch(err => console.error('Error al suscribirse a push', err));
    }
  }, [trabajadorId]);

  const handleIntroEnd = () => {
    setShowIntro(false);
  };

  return (
    <div className="App">
      {showIntro && <IntroVideo onVideoEnd={handleIntroEnd} />}
      {!showIntro && (
        <>
          {
            !usuario ? (
              <CedulaIngreso onUsuarioEncontrado={setUsuario} />
            ) : (
              <BienvenidaSeleccion usuario={usuario} />
            )
          }
        </>
      )}
      <InstallPWAButton />
    </div>
  );
}

// Si necesitas hacer llamadas a la API desde este archivo en el futuro, usa:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

export default App;