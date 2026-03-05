import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import RotateScreen     from './RotateScreen';
import StoryIntro       from './StoryIntro';
import WorldMap         from './WorldMap';
import CircleTransition from './CircleTransition';

/**
 * GameFlow — Orquestador del flujo de juego
 *
 * Props:
 *   step  'rotate' | 'story' | 'map'
 *
 * Flujo de navegación:
 *   /game/rotate-screen  →  /game/story-intro  →  /game/world-map
 *
 * CircleTransition:
 *   • Al montar 'story' y 'map': revela la pantalla (direction="in")
 *   • Al terminar cada paso:     cubre la pantalla (direction="out") → navega
 *
 * WorldMap se agrega en Fase 4.
 * LevelWrapper se agrega en Fase 5.
 */
function GameFlow({ step }) {
  const navigate = useNavigate();

  // — Estado de transiciones (SIEMPRE antes de cualquier return condicional) —
  // revealing: CircleTransition "in" al entrar (no en 'rotate', primer paso)
  const [revealing, setRevealing] = useState(step !== 'rotate');
  // covering: CircleTransition "out" al salir
  const [covering,  setCovering]  = useState(false);

  // — Datos del usuario (guardados por CedulaIngreso + BienvenidaSeleccion) —
  const character = localStorage.getItem('selectedCharacter') || 'bomberman';
  const obraName  =
    localStorage.getItem('obra') ||
    localStorage.getItem('nombre_proyecto') ||
    'la construcción';

  // — Guard: pasos posteriores requieren selectedCharacter —
  if (!localStorage.getItem('selectedCharacter') && step !== 'rotate') {
    return <Navigate to="/bienvenida" replace />;
  }

  // El paso actual terminó → iniciar transición de salida
  const handleStepComplete = () => setCovering(true);

  // Transición de salida terminó → navegar al siguiente paso
  const handleCoverDone = () => {
    if (step === 'rotate') navigate('/game/story-intro', { replace: true });
    if (step === 'story')  navigate('/game/world-map',   { replace: true });
  };

  return (
    <>
      {/* ─── Contenido del paso ─── */}

      {step === 'rotate' && (
        <RotateScreen
          duration={4000}
          onComplete={handleStepComplete}
        />
      )}

      {step === 'story' && (
        <StoryIntro
          character={character}
          obraName={obraName}
          onComplete={handleStepComplete}
        />
      )}

      {/* WorldMap — maneja su propia navegación interna */}
      {step === 'map' && <WorldMap />}

      {/* ─── Transición de entrada: revela la pantalla al montar ─── */}
      {revealing && (
        <CircleTransition
          direction="in"
          onDone={() => setRevealing(false)}
        />
      )}

      {/* ─── Transición de salida: cubre antes de navegar ─── */}
      {covering && (
        <CircleTransition
          direction="out"
          onDone={handleCoverDone}
        />
      )}
    </>
  );
}


export default GameFlow;
