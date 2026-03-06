/**
 * SlowConnectionBanner — aparece cuando se detecta conexión lenta.
 * Ofrece al usuario activar el modo lite (sin animaciones, sin video, sin game).
 *
 * Props:
 *   onUseLite  fn  — el usuario elige modo lite
 *   onDismiss  fn  — el usuario ignora y sigue en modo normal
 */
function SlowConnectionBanner({ onUseLite, onDismiss }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      zIndex: 9000,
      padding: '0 0 env(safe-area-inset-bottom, 0)',
      animation: 'scb-slide-up 0.35s ease both',
    }}>
      <style>{`
        @keyframes scb-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{
        margin: '0 12px 12px',
        background: '#1a1a2e',
        border: '1.5px solid rgba(255,200,0,0.35)',
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.45)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {/* Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.3rem' }}>⚡</span>
          <span style={{
            color: '#FFD700',
            fontWeight: 700,
            fontSize: '0.95rem',
            letterSpacing: '0.01em',
          }}>
            Conexión lenta detectada
          </span>
        </div>

        {/* Descripción */}
        <p style={{
          margin: 0,
          color: 'rgba(255,255,255,0.75)',
          fontSize: '0.84rem',
          lineHeight: 1.5,
        }}>
          La versión lite carga más rápido: sin animaciones, sin video, acceso directo a los formularios.
        </p>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'rgba(255,255,255,0.6)',
              borderRadius: 10,
              padding: '8px 16px',
              fontSize: '0.84rem',
              cursor: 'pointer',
            }}
          >
            Ignorar
          </button>
          <button
            onClick={onUseLite}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none',
              color: '#fff',
              borderRadius: 10,
              padding: '8px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(245,158,11,0.4)',
            }}
          >
            Usar versión lite →
          </button>
        </div>
      </div>
    </div>
  );
}

export default SlowConnectionBanner;
