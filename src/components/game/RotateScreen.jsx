import { useEffect, useState, useRef } from 'react';
import './RotateScreen.css';

/**
 * RotateScreen — pantalla de transición que pide modo horizontal
 *
 * Props:
 *   duration   number  — ms antes de llamar onComplete (default 4000)
 *   onComplete fn      — callback cuando termina el contador
 */
function RotateScreen({ duration = 4000, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [landscape, setLandscape] = useState(window.innerWidth > window.innerHeight);
  const onCompleteRef = useRef(onComplete);
  const calledRef = useRef(false);

  // Mantener ref actualizada sin reiniciar el intervalo
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Detectar orientación
  useEffect(() => {
    const check = () => setLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  // Barra de progreso + disparo de onComplete
  useEffect(() => {
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (pct >= 100 && !calledRef.current) {
        calledRef.current = true;
        clearInterval(interval);
        onCompleteRef.current?.();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  const remainingSec = Math.max(0, Math.ceil(((100 - progress) / 100) * (duration / 1000)));

  return (
    <div className="rs-overlay">
      <div className="rs-content">

        {/* Ícono de teléfono animado */}
        <div className={`rs-phone ${landscape ? 'rs-phone--land' : ''}`}>
          <svg viewBox="0 0 60 100" className="rs-phone-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="52" height="92" rx="8" stroke="currentColor" strokeWidth="4" fill="rgba(255,255,255,0.05)" />
            <circle cx="30" cy="86" r="4" fill="currentColor" opacity="0.6" />
            <rect x="20" y="10" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.4" />
          </svg>
        </div>

        {/* Flecha de rotación */}
        <div className={`rs-rotate-arrow ${landscape ? 'rs-rotate-arrow--done' : ''}`}>
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 15 40 A 25 25 0 1 1 40 65"
              stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none"
            />
            <polygon points="40,56 40,74 28,65" fill="currentColor" />
          </svg>
        </div>

        {/* Texto */}
        <h2 className="rs-title">
          {landscape ? '¡Modo héroe activado!' : 'Gira tu dispositivo'}
        </h2>
        <p className="rs-subtitle">
          {landscape
            ? 'Preparando la misión...'
            : 'Necesitas el modo horizontal para continuar'}
        </p>

        {/* Barra de progreso */}
        <div className="rs-bar">
          <div className="rs-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Contador */}
        {remainingSec > 0 && (
          <p className="rs-countdown">{remainingSec}s</p>
        )}

        {/* Puntos de loading */}
        <div className="rs-dots">
          <span /><span /><span />
        </div>

      </div>
    </div>
  );
}

export default RotateScreen;
