import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * Gruaman admin menu entrypoint.
 * Keeps the existing flat navigation model for all admin tools.
 */
function AdministradorGruaman() {
  const navigate = useNavigate();

  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">Bienvenido Administrador Gruaman</h3>
        <p className="label" style={{ marginBottom: 32 }}>
          Selecciona que deseas administrar:
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/permiso_trabajo_admin")}
          >
            Permiso de Trabajo
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/chequeo_alturas_admin")}
          >
            Chequeo Alturas
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/chequeo_torregruas_admin")}
          >
            Chequeo Torre Grúa
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/chequeo_elevador_admin")}
          >
            Chequeo Elevador
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/inspeccion_EPCC_admins")}
          >
            Inspección EPCC
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/inspeccion_izaje_admin")}
          >
            Inspección Izaje
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/admin_usuarios")}
          >
            Administrar Usuarios
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/admins_obras")}
          >
            Administrar Obras
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/horas_extra_gruaman")}
          >
            Horas Extra Gruaman
          </button>
          <button
            className="button"
            style={{ width: 320, minHeight: 44, fontSize: 14, padding: "10px 16px", whiteSpace: "normal" }}
            onClick={() => navigate("/indicador-central-admin")}
          >
            Indicador Central
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdministradorGruaman;
