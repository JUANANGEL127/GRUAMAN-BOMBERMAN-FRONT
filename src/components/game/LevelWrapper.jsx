import { lazy, Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorldById, getCharacterName } from '../../config/gameConfig';
import CircleTransition  from './CircleTransition';
import QuestionWrapper   from './questions/QuestionWrapper';
import { parseFormToQuestions, submitFormData } from '../../utils/formParser';
import { markWorldComplete } from '../../db/gameProgress';
import { getTimerConfig } from '../../utils/questionTypes';
import './LevelWrapper.css';

/**
 * Mapa de worldId → lazy import del formulario.
 *
 * ⚠️ Los formularios NO se modifican.
 *
 * Detección de completado (modo formulario original):
 *   Cada formulario navega a /eleccion o /eleccionaic al guardar.
 *   Eleccion/EleccionAIC leen localStorage.getItem('game_mode')
 *   y redirigen automáticamente a /game/world-map.
 *
 * ⚠️ IMPORTANTE: los lazy() deben estar fuera del componente
 *   (solo se evalúan una vez en toda la vida de la app).
 */
const FORM_MAP = {
  // ─── Compartidos ───
  'hora-ingreso':              lazy(() => import('../compartido/horada_ingreso')),
  'permiso-trabajo':           lazy(() => import('../compartido/permiso_trabajo')),
  'chequeo-altura':            lazy(() => import('../compartido/chequeo_alturas')),
  'hora-salida':               lazy(() => import('../compartido/hora_salida')),

  // ─── Bomberman ───
  'planilla-bombeo':           lazy(() => import('../bomberman/planillabombeo')),
  'checklist':                 lazy(() => import('../bomberman/checklist')),
  'inspeccion-epcc-bomberman': lazy(() => import('../bomberman/inspeccion_epcc_bomberman')),
  'inventarios-obra':          lazy(() => import('../bomberman/inventariosobra')),

  // ─── Gruaman ───
  'chequeo-torregruas':        lazy(() => import('../gruaman/chequeo_torregruas')),
  'inspeccion-epcc':           lazy(() => import('../gruaman/inspeccion_epcc')),
  'inspeccion-izaje':          lazy(() => import('../gruaman/inspeccion_izaje')),
  'chequeo-elevador':          lazy(() => import('../gruaman/chequeo_elevador')),
};

/**
 * LevelWrapper — wrapper de misión
 *
 * MODO GAMIFICADO (worldId con config en formParser):
 *   • Muestra secciones una por una con QuestionWrapper (flip 3D, confetti)
 *   • Al completar todas → submit al backend → navega a /game/world-map
 *
 * MODO FORMULARIO ORIGINAL (resto de worlds):
 *   • Carga el formulario lazily (sin modificarlo)
 *   • Eleccion/EleccionAIC detectan game_mode y redirigen a /game/world-map
 */
export default function LevelWrapper() {
  const { worldId } = useParams();
  const navigate    = useNavigate();

  const character     = localStorage.getItem('selectedCharacter') || 'bomberman';
  const characterName = getCharacterName(character);
  const world         = getWorldById(character, worldId);

  const [imgError,  setImgError]  = useState(false);
  const [revealing, setRevealing] = useState(true);

  // ── Estado del modo gamificado ──
  const gamifiedSections = parseFormToQuestions(worldId); // null → modo form original
  const isGamified       = !!gamifiedSections;

  const [sectionIdx,   setSectionIdx]   = useState(0);
  const [allAnswers,   setAllAnswers]   = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState(null);
  const [missionDone,  setMissionDone]  = useState(false);

  const allAnswersRef = useRef({});

  // Señalizar game_mode (usado por formularios originales al navegar a /eleccion)
  useEffect(() => {
    localStorage.setItem('game_mode', worldId);
  }, [worldId]);

  // worldId desconocido → volver al mapa
  const FormComponent = FORM_MAP[worldId];
  if (!FormComponent) {
    navigate('/game/world-map', { replace: true });
    return null;
  }

  const shortName  = world?.name.replace(/^Misión:\s*/i, '') || worldId;
  const orderLabel = world?.order ? `MISIÓN ${world.order}` : 'MISIÓN';
  const isCrane    = character === 'gruaman';

  const handleExit = () => {
    localStorage.removeItem('game_mode');
    navigate('/game/world-map', { replace: true });
  };

  // ── Callback cuando QuestionWrapper completa una sección ──
  const handleSectionComplete = useCallback(async (sectionAnswers) => {
    // Acumular respuestas de todas las secciones
    const merged = { ...allAnswersRef.current, ...sectionAnswers };
    allAnswersRef.current = merged;
    setAllAnswers(merged);

    // ── Detección de skip (preámbulo: "¿Debes llenar este formulario? → No") ──
    if (sectionAnswers['__preamble__'] === 'skip') {
      markWorldComplete(worldId);
      localStorage.removeItem('game_mode');
      setMissionDone(true);
      setTimeout(() => navigate('/game/world-map', { replace: true }), 800);
      return;
    }

    const isLastSection = sectionIdx >= gamifiedSections.length - 1;

    if (!isLastSection) {
      // Avanzar a la siguiente sección
      setSectionIdx(prev => prev + 1);
      return;
    }

    // Última sección → submit
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitFormData(worldId, merged);
      markWorldComplete(worldId);
      localStorage.removeItem('game_mode');
      setMissionDone(true);
      // Pequeña pausa para mostrar pantalla de éxito antes de navegar
      setTimeout(() => navigate('/game/world-map', { replace: true }), 1800);
    } catch (err) {
      console.error('[LevelWrapper] submit error:', err);
      setSubmitError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.');
      setSubmitting(false);
    }
  }, [sectionIdx, gamifiedSections, worldId, navigate]);

  // ─── Sección actual (modo gamificado) ───────────────────────────────────────
  const currentSection = isGamified ? gamifiedSections[sectionIdx] : null;
  const timerConfig    = currentSection?.enableTimer
    ? { duration: currentSection.timerDuration ?? getTimerConfig(currentSection.id)?.duration ?? 90 }
    : null;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="lw-root">

      {/* ─── Nubes decorativas ─── */}
      <div className="lw-clouds" aria-hidden="true">
        <span className="lw-cloud lw-cloud--1">☁️</span>
        <span className="lw-cloud lw-cloud--2">☁️</span>
        <span className="lw-cloud lw-cloud--3">☁️</span>
      </div>

      {/* ─── Header de la misión ─── */}
      <header className="lw-header">

        <div className="lw-avatar-wrap">
          {!imgError ? (
            <img
              src={`/assets/${character}-idle.png`}
              alt={characterName}
              className="lw-avatar"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="lw-avatar-emoji" aria-hidden="true">
              {isCrane ? '🏗️' : '💧'}
            </span>
          )}
        </div>

        <div className="lw-mission-info">
          <span className={`lw-mission-label lw-mission-label--${character}`}>
            {orderLabel}
          </span>
          <span className="lw-mission-name">{shortName}</span>
          {/* Progreso de secciones (solo modo gamificado) */}
          {isGamified && (
            <span className="lw-section-progress">
              {currentSection?.name || ''} · {sectionIdx + 1}/{gamifiedSections.length}
            </span>
          )}
        </div>

        <button
          className="lw-exit-btn"
          onClick={handleExit}
          aria-label="Salir de la misión"
          title="Salir al mapa"
        >
          ✕
        </button>

      </header>

      {/* ══════════════════════════════════════════════════════════════
          MODO GAMIFICADO — QuestionWrapper sección por sección
          ══════════════════════════════════════════════════════════════ */}
      {isGamified && !submitting && !missionDone && !submitError && currentSection && (
        <div className="lw-game-container">
          <QuestionWrapper
            key={currentSection.id}              /* remonta en cada sección */
            questions={currentSection.questions}
            sectionName={currentSection.name}
            timerConfig={timerConfig}
            onComplete={handleSectionComplete}
          />
        </div>
      )}

      {/* ── Enviando al servidor ── */}
      {isGamified && submitting && (
        <div className="lw-status lw-status--loading" aria-live="polite">
          <span className="lw-status-icon">⏳</span>
          <p>Guardando misión…</p>
        </div>
      )}

      {/* ── Misión completada ── */}
      {isGamified && missionDone && (
        <div className="lw-status lw-status--success" aria-live="polite">
          <span className="lw-status-icon">🏆</span>
          <p>¡Misión completada!</p>
        </div>
      )}

      {/* ── Error de envío ── */}
      {isGamified && submitError && (
        <div className="lw-status lw-status--error" role="alert">
          <span className="lw-status-icon">⚠️</span>
          <p>{submitError}</p>
          <button
            className="lw-retry-btn"
            onClick={() => handleSectionComplete({})}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODO FORMULARIO ORIGINAL — sin modificar
          ══════════════════════════════════════════════════════════════ */}
      {!isGamified && (
        <div className="lw-form-container">
          <Suspense fallback={<LevelLoading />}>
            <FormComponent />
          </Suspense>
        </div>
      )}

      {/* ─── Reveal al entrar ─── */}
      {revealing && (
        <CircleTransition direction="in" onDone={() => setRevealing(false)} />
      )}

    </div>
  );
}

function LevelLoading() {
  return (
    <div className="lw-loading" aria-live="polite">
      <span className="lw-loading-icon">⏳</span>
      <span>Cargando misión…</span>
    </div>
  );
}
