import './WorldNode.css';

/**
 * Configuración visual por estado
 * Fase 5 usará 'completed' e 'in_progress' con datos reales
 */
const STATUS = {
  completed:   { badge: '✅', label: 'Listo',     cls: 'wn--completed' },
  in_progress: { badge: '⏳', label: 'En curso',  cls: 'wn--progress'  },
  pending:     { badge: '❗', label: 'Pendiente', cls: 'wn--pending'   },
  optional:    { badge: '💡', label: 'Opcional',  cls: 'wn--optional'  },
  locked:      { badge: '🔒', label: 'Bloqueado', cls: 'wn--locked'    },
};

/**
 * WorldNode — nodo individual del mapa de mundos
 *
 * Props:
 *   world         object   — entrada de gameConfig (id, name, icon, color, bgColor, order, shared)
 *   status        string   — 'completed' | 'in_progress' | 'pending' | 'optional' | 'locked'
 *   isHighlighted boolean  — activa animación de bounce (tutorial)
 *   onClick       fn       — llamado con world.id (solo si no está locked)
 */
export default function WorldNode({ world, status = 'locked', isHighlighted = false, onClick }) {
  const cfg      = STATUS[status] ?? STATUS.locked;
  const clickable = status !== 'locked';

  // Quitar prefijo "Misión: " para que quepa en la card pequeña
  const shortName = world.name.replace(/^Misión:\s*/i, '');

  const classes = [
    'wn-card',
    cfg.cls,
    isHighlighted ? 'wn-highlight' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      style={{ '--wn-color': world.color, '--wn-bg': world.bgColor }}
      onClick={clickable ? () => onClick?.(world.id) : undefined}
      disabled={!clickable}
      aria-label={`${shortName} — ${cfg.label}`}
      aria-disabled={!clickable}
    >
      {/* Número de orden — esquina superior izquierda */}
      <span className="wn-order" aria-hidden="true">
        {world.order}
      </span>

      {/* Badge "compartido" — esquina superior derecha */}
      {world.shared && (
        <span className="wn-shared" title="Misión compartida" aria-label="Compartida">
          🤝
        </span>
      )}

      {/* Ícono principal */}
      <span className="wn-icon" aria-hidden="true">
        {world.icon}
      </span>

      {/* Nombre corto */}
      <span className="wn-name">
        {shortName}
      </span>

      {/* Badge de estado */}
      <span className={`wn-badge wn-badge--${status}`}>
        <span aria-hidden="true">{cfg.badge}</span>
        {cfg.label}
      </span>
    </button>
  );
}
