import React, { useEffect, useState } from "react";
import axios from "axios";
import PermisoTrabajoAdmin from "./permiso_trabajo_admin";
import ChequeoAlturasAdmin from "./chequeo_alturas_admin";
import ChequeoTorreGruasAdmin from "./chequeo_torregruas_admin";
import ChequeoElevadorAdmin from "./chequeo_elevador_admin";
import LlegadaSalidaAdmin from "./llegada_salida_admin";
import AdminsObras from "./admins_obras"; // importar el componente
import { useNavigate } from "react-router-dom";

// Usa variable de entorno para la base de la API (por si se usa en este archivo en el futuro)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

// Panel administrador visual tipo menú, similar a eleccion.jsx pero sin barra de progreso ni lógica de botones
function AdministradorGruaman() {
  // Estado para registros, carga y búsqueda
  const [registros, set_registros] = useState([]);
  const [loading, set_loading] = useState(true);
  const [showPermisoTrabajoAdmin, setShowPermisoTrabajoAdmin] = useState(false);
  const [showChequeoAlturasAdmin, setShowChequeoAlturasAdmin] = useState(false);
  const [showChequeoTorreGruasAdmin, setShowChequeoTorreGruasAdmin] = useState(false);
  const [showChequeoElevadorAdmin, setShowChequeoElevadorAdmin] = useState(false);
  const [showLlegadaSalidaAdmin, setShowLlegadaSalidaAdmin] = useState(false);
  const api_url = "http://localhost:3000";
  const navigate = useNavigate();


  // Renderizado del panel administrador
  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">
          Bienvenido Administrador Gruaman
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
            onClick={() => navigate("/llegada_salida_admin")}
          >
            Formulario de llegada y salida
          </button>
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
            onClick={() => navigate("/chequeo_torregruas_admin")}
          >
            Chequeo Torre Grúa
          </button>
          <button
            className="button"
            style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
            onClick={() => navigate("/chequeo_elevador_admin")}
          >
            Chequeo Elevador
          </button>
          <button className="button" 
          style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
          onClick={() => navigate("/inspeccion_EPCC_admins")}
          >
            Inspección EPCC
          </button>
          <button className="button" 
          style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
          onClick={() => navigate("/inspeccion_izaje_admin")}
          >
            Inspección Izaje
          </button>
          <button className="button" 
          style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
          onClick={() => navigate("/admin_usuarios")}
          >
            Administrar Usuarios
          </button>
          <button className="button" 
          style={{ maxWidth: 320, minHeight: 44, fontSize: 16, padding: "8px 0" }}
          onClick={() => navigate("/admins_obras")}
          >
            Administrar Obras
          </button>
        </div>
        {showLlegadaSalidaAdmin && (
          <div style={{ marginTop: 24 }}>
            <LlegadaSalidaAdmin />
          </div>
        )}
        {showPermisoTrabajoAdmin && (
          <div style={{ marginTop: 24 }}>
            <PermisoTrabajoAdmin />
          </div>
        )}
        {showChequeoAlturasAdmin && (
          <div style={{ marginTop: 24 }}>
            <ChequeoAlturasAdmin />
          </div>
        )}
        {showChequeoTorreGruasAdmin && (
          <div style={{ marginTop: 24 }}>
            <ChequeoTorreGruasAdmin />
          </div>
        )}
        {showChequeoElevadorAdmin && (
          <div style={{ marginTop: 24 }}>
            <ChequeoElevadorAdmin />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdministradorGruaman;
