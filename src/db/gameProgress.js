/**
 * gameProgress.js — Sistema de progreso por localStorage
 *
 * Clave de progreso: game_progress_{cedula}_{obra_id}_{fecha}
 * → se resetea cada día (correcto para checklists diarios)
 * → es por usuario y por obra
 *
 * Fase 6+: si se necesita histórico, migrar a IndexedDB (Dexie)
 */

/** Construye la clave de progreso del día actual */
function getProgressKey() {
  const cedula = localStorage.getItem('cedula_trabajador') || 'anon';
  const obraId = localStorage.getItem('obra_id')           || '0';
  const fecha  = new Date().toISOString().split('T')[0];    // YYYY-MM-DD
  return `game_progress_${cedula}_${obraId}_${fecha}`;
}

/**
 * Devuelve array de worldIds completados hoy en esta obra.
 * @returns {string[]}
 */
export function getCompletedWorlds() {
  try {
    const raw = localStorage.getItem(getProgressKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Marca un mundo como completado.
 * Idempotente: no duplica si ya estaba marcado.
 * @param {string} worldId
 */
export function markWorldComplete(worldId) {
  try {
    const completed = getCompletedWorlds();
    if (!completed.includes(worldId)) {
      completed.push(worldId);
      localStorage.setItem(getProgressKey(), JSON.stringify(completed));
    }
  } catch {
    // Cuota de localStorage excedida — ignorar silenciosamente
  }
}

/**
 * Comprueba si un mundo ya fue completado hoy.
 * @param {string} worldId
 * @returns {boolean}
 */
export function isWorldComplete(worldId) {
  return getCompletedWorlds().includes(worldId);
}

/**
 * Calcula el estado de un mundo dado el array de completados y
 * la lista completa de mundos (ordenados por world.order).
 *
 * Lógica de desbloqueo secuencial:
 *   - completed  → ya fue completado
 *   - pending    → es el primer mundo sin completar (desbloqueado)
 *   - locked     → aún no llegó su turno
 *   - optional   → world.daily === false y no completado
 *
 * @param {object}   world          — entrada de gameConfig
 * @param {string[]} completedIds   — de getCompletedWorlds()
 * @param {object[]} allWorlds      — todos los mundos del personaje
 * @returns {'completed'|'pending'|'locked'|'optional'}
 */
export function computeWorldStatus(world, completedIds, allWorlds) {
  if (completedIds.includes(world.id)) return 'completed';

  // Mundos no diarios → siempre opcionales (desbloqueados pero no bloquean el flujo)
  if (world.daily === false) return 'optional';

  // Primer mundo diario sin completar → pendiente (desbloqueado)
  const firstPending = allWorlds
    .filter(w => w.daily !== false && !completedIds.includes(w.id))
    .sort((a, b) => a.order - b.order)[0];

  if (world.id === firstPending?.id) return 'pending';

  return 'locked';
}
