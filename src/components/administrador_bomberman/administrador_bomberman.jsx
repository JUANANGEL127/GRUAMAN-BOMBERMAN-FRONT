import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminObrasBomberman from "./admin_obras_bomberman"; // importar el componente

// Panel administrador visual tipo menú, similar a eleccion.jsx pero sin barra de progreso ni lógica de botones
function AdministradorBomberman() {
  const navigate = useNavigate();

  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">
          Bienvenido Administrador Bomberman
        </h3>
        <p className="label" style={{ marginBottom: 32 }}>
          Selecciona que deseas administrar:
        </p>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8
        }}>
              <button
            className="button"
            style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
            onClick={() => navigate("/permiso_trabajo_admin")}
          >
            Permiso de Trabajo
          </button>
          <button
            className="button"
            style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
            onClick={() => navigate("/chequeo_alturas_admin")}
          >
            Chequeo Alturas
          </button>
          <button
            className="button"
            style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
            onClick={() => navigate("/admin_usuarios_bomberman")}
          >
            Administrar Usuarios
          </button>
          <button
            className="button"
            style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
            onClick={() => navigate("/admin_obras_bomberman")}
          >
            Administrar Obras
          </button>
          {/* Nuevos botones admin */}
          <button
            className="button"
            style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
            onClick={() => navigate("/planilla_bombeo_admin")}
          >
            Planilla Bombeo
          </button>
          <button
            className="button"
            style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
            onClick={() => navigate("/inventarios_obra_admin")}
          >
            Inventarios Obra 
          </button>
          <button
            className="button"
            style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
            onClick={() => navigate("/checklist_admin")}
          >
            Checklist 
          </button>
          <button
            className="button"
            style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
            onClick={() => navigate("/inspeccion_epcc_bomberman_admin")}
          >
            Inspección EPCC 
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdministradorBomberman;
