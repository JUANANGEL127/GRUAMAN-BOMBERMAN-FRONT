import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PlanillaDeBombeo from "./planillabombeo";
import Checklist from "./checklist";
import InventariosObra from "./inventariosobra";
import Administrador from "../administrador_gruaman/administrador";
import AdministradorBomberman from "../administrador_bomberman/administrador_bomberman"; // importar el componente
import "../../App.css";
import PermisoTrabajo from "../compartido/permiso_trabajo";
import ChequeoAlturas from "../compartido/chequeo_alturas";
import inspeccionEpccBomberman from "./inspeccion_epcc_bomberman"; // importación del nuevo componente

// Usa variable de entorno para la base de la API (por si se usa en este archivo en el futuro)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

// Utiliza localStorage para persistir el estado de los botones usados
function getUsadosFromStorage(usuario) {
  try {
    const data = localStorage.getItem(`aic_usados_${usuario}`);
    if (data) return JSON.parse(data);
  } catch {}
  // Asegura que todos los keys estén presentes
  return {
    permiso_trabajo: false,
    planillabombeo: false,
    checklist: false,
    inventariosobra: false,
    administrador: false,
    chequeo_alturas: false,
    inspeccion_epcc_bomberman: false, // debe estar este key para la barra
  };
}

function setUsadosToStorage(usados, usuario) {
  localStorage.setItem(`aic_usados_${usuario}`, JSON.stringify(usados));
}

function limpiarUsados(usuario) {
  localStorage.removeItem(`aic_usados_${usuario}`);
}

function BienvenidaAIC() {
  const navigate = useNavigate();
  const empresa = localStorage.getItem("empresa") || "";
  const nombre = localStorage.getItem("nombre_trabajador") || "";
  let empresaNombre = "";
  if (empresa === "GyE") empresaNombre = "GruaMan";
  else if (empresa === "AIC") empresaNombre = "BomberMan";
  else empresaNombre = "";

  // El progreso es por usuario
  const usuario = nombre || "anonimo";
  const [usados, setUsados] = useState(() => getUsadosFromStorage(usuario));
  const [usuarioActual, setUsuarioActual] = useState(usuario);

  // Reinicia el progreso cada vez que se detecta un nuevo ingreso (usuario o empresa cambia)
  useEffect(() => {
    const nuevoUsuario = localStorage.getItem("nombre_trabajador") || "anonimo";
    const nuevaEmpresa = localStorage.getItem("empresa") || "";
    const key = `${nuevoUsuario}__${nuevaEmpresa}`;
    if (key !== usuarioActual) {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(key));
      setUsuarioActual(key);
    }
    // eslint-disable-next-line
  }, [localStorage.getItem("nombre_trabajador"), localStorage.getItem("empresa")]);

  useEffect(() => {
    setUsadosToStorage(usados, usuarioActual);
  }, [usados, usuarioActual]);

  const handleNavigate = (ruta, key) => {
    setUsados(prev => {
      const nuevos = { ...prev, [key]: true };
      setUsadosToStorage(nuevos, usuarioActual);
      return nuevos;
    });
    navigate(ruta);
  };

  const getButtonClass = (usado) =>
    usado ? "button button-green" : "button";

  // Barra de progreso
  const total = 7; // número real de formularios (botones)
  const completados = Object.values(usados).filter(Boolean).length;
  const porcentaje = Math.round((completados / total) * 100);

  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">
          Bienvenido Super Heroe{empresaNombre ? ` ${empresaNombre}` : ""}{nombre ? ` ${nombre}` : ""}
        </h3>
        <div style={{ margin: "18px 0 24px 0" }}>
          <div style={{
            width: "100%",
            background: "#e0e0e0",
            borderRadius: 8,
            height: 18,
            position: "relative",
            marginBottom: 6,
            overflow: "hidden"
          }}>
            <div
              style={{
                width: `${porcentaje}%`,
                background: porcentaje === 100 ? "linear-gradient(90deg,#43a047,#66bb6a)" : "linear-gradient(90deg,#1976d2,#90caf9)",
                height: "100%",
                borderRadius: 8,
                transition: "width 0.4s cubic-bezier(.4,2,.3,1)"
              }}
            />
            <span style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
              color: porcentaje === 100 ? "#fff" : "#222",
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: 0.5
            }}>
              {porcentaje}%
            </span>
          </div>
          <div style={{ textAlign: "center", fontSize: 13, color: "#1976d2", fontWeight: 500 }}>
            {completados} de {total} formularios completados
          </div>
        </div>
        <p className="label" style={{ marginBottom: 32 }}>
          Selecciona el formulario que deseas usar:
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button
            className={getButtonClass(usados.permiso_trabajo)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/permiso_trabajo", "permiso_trabajo")}
          >
            Permiso de Trabajo diario precargado
          </button>
          <button
            className={getButtonClass(usados.planillabombeo)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/planillabombeo", "planillabombeo")}
          >
            Planilla de Bombeo diario sin precargar
          </button>
          <button
            className={getButtonClass(usados.checklist)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/checklist", "checklist")}
          >
            Checklist diario precargado
          </button>
          <button
            className={getButtonClass(usados.inventariosobra)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/inventariosobra", "inventariosobra")}
          >
            Inventario de Obra mensual sin validacion y mostrar lleno 
          </button>
          <button
            className={getButtonClass(usados.chequeo_alturas)}
            style={{
              maxWidth: 320,
              background: "linear-gradient(145deg, var(--naranja), var(--naranja-claro))",
              color: "#fff",
              fontWeight: 600
            }}
            onClick={() => handleNavigate("/chequeo_alturas", "chequeo_alturas")}
          >
            Chequeo Alturas diario precargado
          </button>
          <button
            className={getButtonClass(usados.inspeccion_epcc_bomberman)} // clase para el nuevo botón
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/inspeccion_epcc_bomberman", "inspeccion_epcc_bomberman")}
          >
            Inspección EPCC diario precargado
          </button>
          <button
            className="button"
            style={{
              maxWidth: 320,
              marginTop: 24,
              background: porcentaje === 100 ? "#ff9800" : "#bdbdbd",
              color: "#fff",
              fontWeight: 600,
              cursor: porcentaje === 100 ? "pointer" : "not-allowed",
              opacity: porcentaje === 100 ? 1 : 0.7
            }}
            disabled={porcentaje !== 100}
            onClick={() => {
              if (porcentaje === 100) {
                if (window.confirm("¿Estás seguro que deseas terminar? Esto reiniciará tu progreso.")) {
                  limpiarUsados(usuarioActual);
                  setUsados(getUsadosFromStorage(usuarioActual));
                }
              }
            }}
          >
            Terminar
          </button>
        </div>
      </div>
    </div>
  );
}

function EleccionAIC() {
  return (
    <Routes>
      <Route path="/" element={<BienvenidaAIC />} />
      <Route path="/planillabombeo" element={<PlanillaDeBombeo />} />
      <Route path="/checklist" element={<Checklist />} />
      <Route path="/inventariosobra" element={<InventariosObra />} />
      <Route path="/administrador" element={<Administrador />} />
      <Route path="/administrador_bomberman" element={<AdministradorBomberman />} />
      <Route path="/permiso_trabajo" element={<PermisoTrabajo />} />
      <Route path="/chequeo_alturas" element={<ChequeoAlturas />} />
      <Route path="/inspeccion_epcc_bomberman" element={<inspeccionEpccBomberman />} /> {/* nuevo route */}
    </Routes>
  );
}

export default EleccionAIC;
