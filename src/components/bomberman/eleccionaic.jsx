import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import PlanillaDeBombeo from "./planillabombeo";
import Checklist from "./checklist";
import InventariosObra from "./inventariosobra";
import Administrador from "../administrador";
import "../../App.css";
import PermisoTrabajo from "../compartido/permiso_trabajo";

// Utiliza localStorage para persistir el estado de los botones usados
function getUsadosFromStorage(usuario) {
  try {
    const data = localStorage.getItem(`aic_usados_${usuario}`);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    permiso_trabajo: false,
    planillabombeo: false,
    checklist: false,
    inventariosobra: false,
    administrador: false,
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

  // Si cambia el usuario (por ejemplo, cierre de sesión), reinicia el progreso
  useEffect(() => {
    const nuevoUsuario = localStorage.getItem("nombre_trabajador") || "anonimo";
    if (nuevoUsuario !== usuarioActual) {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(nuevoUsuario));
      setUsuarioActual(nuevoUsuario);
    }
    // eslint-disable-next-line
  }, [localStorage.getItem("nombre_trabajador")]);

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
  const total = Object.keys(usados).length;
  const completados = Object.values(usados).filter(Boolean).length;
  const porcentaje = Math.round((completados / total) * 100);

  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">
          Bienvenido{empresaNombre ? ` ${empresaNombre}` : ""}{nombre ? ` ${nombre}` : ""}
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <button
            className={getButtonClass(usados.permiso_trabajo)}
            style={{ maxWidth: 320, marginTop: 18 }}
            onClick={() => handleNavigate("/permiso_trabajo", "permiso_trabajo")}
          >
            Permiso de Trabajo
          </button>
          <button
            className={getButtonClass(usados.planillabombeo)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/planillabombeo", "planillabombeo")}
          >
            Planilla de Bombeo
          </button>
          <button
            className={getButtonClass(usados.checklist)}
            style={{ maxWidth: 320, marginTop: 18 }}
            onClick={() => handleNavigate("/checklist", "checklist")}
          >
            Checklist
          </button>
          <button
            className={getButtonClass(usados.inventariosobra)}
            style={{ maxWidth: 320, marginTop: 18 }}
            onClick={() => handleNavigate("/inventariosobra", "inventariosobra")}
          >
            Inventario de Obra
          </button>
          <button
            className={getButtonClass(usados.administrador)}
            style={{ maxWidth: 320, marginTop: 18 }}
            onClick={() => handleNavigate("/administrador", "administrador")}
          >
            Panel Administrador
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
      <Route path="/permiso_trabajo" element={<PermisoTrabajo />} />
    </Routes>
  );
}

export default EleccionAIC;
