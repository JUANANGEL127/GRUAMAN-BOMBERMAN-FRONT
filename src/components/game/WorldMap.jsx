import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorldsByCharacter, getCharacterName } from '../../config/gameConfig';
import { getCompletedWorlds, computeWorldStatus, markWorldComplete } from '../../db/gameProgress';
import WorldNode        from './WorldNode';
import CircleTransition from './CircleTransition';
import './WorldMap.css';

const TUTORIAL_KEY = 'game_tutorial_seen';

/**
 * WorldMap — mapa de mundos estilo Mario Bros
 *
 * Lee character de localStorage.
 * Renderiza WorldNodes con scroll horizontal.
 * Maneja navegación a /game/level/:worldId y /bienvenida.
 */
export default function WorldMap() {
  const navigate = useNavigate();

  // ── Datos del usuario ──
  const character     = localStorage.getItem('selectedCharacter') || 'bomberman';
  const userName      = localStorage.getItem('nombre_trabajador')  || 'Héroe';
  const characterName = getCharacterName(character);
  const isCrane       = character === 'gruaman';

  // ── Mundos del personaje ──
  const worlds      = getWorldsByCharacter(character);
  const dailyWorlds = worlds.filter(w => w.daily !== false);

  const [completedIds, setCompletedIds] = useState(() => getCompletedWorlds());
  const completedCount = dailyWorlds.filter(w => completedIds.includes(w.id)).length;

  // ── Detectar completado al volver de un formulario ──
  // Los formularios que usan navigate(-1) vuelven aquí; game_mode indica qué mundo completaron.
  useEffect(() => {
    const worldId = localStorage.getItem('game_mode');
    if (worldId) {
      localStorage.removeItem('game_mode');
      markWorldComplete(worldId);
      setCompletedIds(getCompletedWorlds());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Layout en zigzag ──
  const ZIGZAG = ['right', 'left', 'center'];
  // Centro X de cada posición como % del ancho del track (para SVG de conectores)
  const POS_X  = { right: '83%', left: '13%', center: '50%' };

  // ── Avatar fallback ──
  const [imgError, setImgError] = useState(false);

  // ── Tutorial ──
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem(TUTORIAL_KEY)
  );
  const tutorialTimerRef = useRef(null);

  const dismissTutorial = () => {
    setShowTutorial(false);
    try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch { /* quota */ }
    clearTimeout(tutorialTimerRef.current);
  };

  // Auto-dismiss después de 6 segundos
  useEffect(() => {
    if (!showTutorial) return;
    tutorialTimerRef.current = setTimeout(dismissTutorial, 6000);
    return () => clearTimeout(tutorialTimerRef.current);
  // dismissTutorial es estable (solo llama setState + localStorage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTutorial]);

  // ── Navegación con CircleTransition ──
  const [covering,    setCovering]    = useState(false);
  const [destination, setDestination] = useState(null);

  const navigateTo = (path) => {
    setDestination(path);
    setCovering(true);
  };

  const handleCoverDone = () => {
    if (destination) navigate(destination);
  };

  // ── Progreso ──
  const progressPct = dailyWorlds.length > 0
    ? (completedCount / dailyWorlds.length) * 100
    : 0;

  return (
    <div className="wm-root">

      {/* ─── Nubes decorativas ─── */}
      <div className="wm-clouds" aria-hidden="true">
        <span className="wm-cloud wm-cloud--1">☁️</span>
        <span className="wm-cloud wm-cloud--2">☁️</span>
        <span className="wm-cloud wm-cloud--3">☁️</span>
      </div>

      {/* ─── Header ─── */}
      <header className="wm-header">
        {/* Avatar */}
        <div className="wm-avatar-wrap">
          {!imgError ? (
            <img
              src={`/assets/${character}-idle.png`}
              alt={characterName}
              className="wm-avatar"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="wm-avatar-emoji" aria-hidden="true">
              {isCrane ? '🏗️' : '💧'}
            </span>
          )}
        </div>

        {/* Nombre + personaje */}
        <div className="wm-user-info">
          <span className="wm-user-name">{userName}</span>
          <span className={`wm-char-name wm-char-name--${character}`}>
            {characterName}
          </span>
        </div>

        {/* Progreso del día */}
        <div className="wm-progress-wrap">
          <span className="wm-progress-label">
            {completedCount}/{dailyWorlds.length} misiones
          </span>
          <div
            className="wm-progress-bar"
            role="progressbar"
            aria-valuenow={completedCount}
            aria-valuemax={dailyWorlds.length}
            aria-label="Progreso del día"
          >
            <div
              className="wm-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {/* ─── Tutorial ─── */}
      {showTutorial && (
        <div className="wm-tutorial" role="status">
          <button
            className="wm-tutorial-close"
            onClick={dismissTutorial}
            aria-label="Cerrar tutorial"
          >
            ✕
          </button>
          <p className="wm-tutorial-text">
            ¡Hola, <strong>{characterName}</strong>! 👋
          </p>
          <p className="wm-tutorial-text">
            Empieza la misión por aquí 👇
          </p>
          {/* Cola apuntando hacia abajo al primer nodo */}
          <div className="wm-tutorial-tail" aria-hidden="true" />
        </div>
      )}

      {/* ─── Scroll vertical de mundos en zigzag ─── */}
      <div className="wm-scroll">
        <div className="wm-track">

          {worlds.flatMap((world, index) => {
            const pos     = ZIGZAG[index % ZIGZAG.length];
            const posNext = ZIGZAG[(index + 1) % ZIGZAG.length];
            return [
              /* Nodo del mundo */
              <div key={world.id} className={`wm-node-slot wm-node-slot--${pos}`}>
                <WorldNode
                  world={world}
                  status={computeWorldStatus(world, completedIds, worlds)}
                  isHighlighted={index === 0 && showTutorial}
                  onClick={(id) => navigateTo(`/game/level/${id}`)}
                />
              </div>,

              /* Conector diagonal SVG (no después del último) */
              index < worlds.length - 1 && (
                <svg
                  key={`conn-${world.id}`}
                  className="wm-connector-svg"
                  width="100%"
                  height="48"
                  aria-hidden="true"
                >
                  <line
                    x1={POS_X[pos]}     y1="0"
                    x2={POS_X[posNext]} y2="48"
                    stroke="rgba(255,210,80,0.6)"
                    strokeWidth="3"
                    strokeDasharray="8 5"
                    strokeLinecap="round"
                  />
                </svg>
              ),
            ];
          }).filter(Boolean)}

          {/* Bandera de meta */}
          <div className={`wm-finish wm-finish--${ZIGZAG[worlds.length % ZIGZAG.length]}`} aria-label="Meta final">
            <span className="wm-finish-flag">🏁</span>
          </div>

        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="wm-footer">
        <button
          className="wm-salir"
          onClick={() => navigateTo('/bienvenida')}
        >
          ← Salir
        </button>
      </footer>

      {/* ─── Transición de salida ─── */}
      {covering && (
        <CircleTransition direction="out" onDone={handleCoverDone} />
      )}

    </div>
  );
}
