import { lazy, Suspense, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorldById, getCharacterName } from '../../config/gameConfig';
import CircleTransition from './CircleTransition';
import './LevelWrapper.css';

/**
 * Mapa de worldId → lazy import del formulario.
 *
 * ⚠️ Los formularios NO se modifican.
 *
 * Detección de completado:
 *   Cada formulario navega a /eleccion o /eleccionaic al guardar.
 *   Eleccion/EleccionAIC leen localStorage.getItem('game_mode')
 *   y redirigen automáticamente a /game/world-map.
 *
 * ⚠️ IMPORTANTE: los lazy() deben estar fuera del componente
 *   (solo se evalúan una vez en toda la vida de la app).
 */
const FORM_MAP = {
  // ─── Compartidos ───
  'hora-ingreso':             lazy(() => import('../compartido/horada_ingreso')),
  'permiso-trabajo':          lazy(() => import('../compartido/permiso_trabajo')),
  'chequeo-altura':           lazy(() => import('../compartido/chequeo_alturas')),
  'hora-salida':              lazy(() => import('../compartido/hora_salida')),

  // ─── Bomberman ───
  'planilla-bombeo':          lazy(() => import('../bomberman/planillabombeo')),
  'checklist':                lazy(() => import('../bomberman/checklist')),
  'inspeccion-epcc-bomberman':lazy(() => import('../bomberman/inspeccion_epcc_bomberman')),
  'inventarios-obra':         lazy(() => import('../bomberman/inventariosobra')),

  // ─── Gruaman ───
  'chequeo-torregruas':       lazy(() => import('../gruaman/chequeo_torregruas')),
  'inspeccion-epcc':          lazy(() => import('../gruaman/inspeccion_epcc')),
  'inspeccion-izaje':         lazy(() => import('../gruaman/inspeccion_izaje')),
  'chequeo-elevador':         lazy(() => import('../gruaman/chequeo_elevador')),
};

/**
 * LevelWrapper — wrapper de misión para formularios existentes
 *
 * • Muestra un header con personaje + nombre de la misión
 * • Carga el formulario lazily (sin modificarlo)
 * • Señaliza game_mode en localStorage para que Eleccion/EleccionAIC
 *   detecten el completado y redirijan a /game/world-map
 */
export default function LevelWrapper() {
  const { worldId } = useParams();
  const navigate    = useNavigate();

  const character     = localStorage.getItem('selectedCharacter') || 'bomberman';
  const characterName = getCharacterName(character);
  const world         = getWorldById(character, worldId);

  const [imgError,   setImgError]   = useState(false);
  const [revealing,  setRevealing]  = useState(true);

  // Señalizar al sistema de juego que estamos en esta misión.
  // Eleccion/EleccionAIC leerán este flag después del submit.
  useEffect(() => {
    localStorage.setItem('game_mode', worldId);
    // No limpiar en cleanup: el cleanup corre ANTES de que Eleccion se monte
    // cuando el form navega. game_mode lo limpia Eleccion, no este efecto.
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

  // El botón ✕ limpia game_mode explícitamente (el usuario sale sin completar)
  const handleExit = () => {
    localStorage.removeItem('game_mode');
    navigate('/game/world-map', { replace: true });
  };

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

        {/* Personaje pequeño flotante */}
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

        {/* Info de la misión */}
        <div className="lw-mission-info">
          <span className={`lw-mission-label lw-mission-label--${character}`}>
            {orderLabel}
          </span>
          <span className="lw-mission-name">{shortName}</span>
        </div>

        {/* Botón salir — limpia game_mode */}
        <button
          className="lw-exit-btn"
          onClick={handleExit}
          aria-label="Salir de la misión"
          title="Salir al mapa"
        >
          ✕
        </button>

      </header>

      {/* ─── Formulario original (sin modificar) ─── */}
      <div className="lw-form-container">
        <Suspense fallback={<LevelLoading />}>
          <FormComponent />
        </Suspense>
      </div>

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
