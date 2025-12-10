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
import HoraIngreso from "../compartido/horada_ingreso";
import HoraSalida from "../compartido/hora_salida";

// Usa variable de entorno para la base de la API (por si se usa en este archivo en el futuro)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

// Utiliza localStorage para persistir el estado de los botones usados
function getUsadosFromStorage(usuario) {
  try {
    const data = localStorage.getItem(`aic_usados_${usuario}`);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    hora_ingreso: false, // nuevo
    permiso_trabajo: false,
    planillabombeo: false,
    checklist: false,
    inventariosobra: false,
    chequeo_alturas: false,
    inspeccion_epcc_bomberman: false,
    hora_salida: false // nuevo
  };
}

function setUsadosToStorage(usados, usuario) {
  localStorage.setItem(`aic_usados_${usuario}`, JSON.stringify(usados));
}

function limpiarUsados(usuario) {
  localStorage.removeItem(`aic_usados_${usuario}`);
  // eliminar la marca de fecha para forzar recreación al guardar de nuevo
  try { localStorage.removeItem(`aic_usados_date_${usuario}`); } catch {}
}

// Helper para obtener la fecha actual en formato YYYY-MM-DD
function getTodayDateStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// --- NUEVO: Helpers para control mensual de inventario de obra ---
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function isFirstDayOfMonth() {
  return new Date().getDate() === 1;
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
    // Guardar usados y anotar la fecha para saber si tocar reiniciar al día siguiente
    setUsadosToStorage(usados, usuarioActual);
    try { localStorage.setItem(`aic_usados_date_${usuarioActual}`, getTodayDateStr()); } catch {}
  }, [usados, usuarioActual]);

  // Efecto: reinicio diario a medianoche (y comprobación inicial)
  useEffect(() => {
    const dateKey = `aic_usados_date_${usuarioActual}`;
    const today = getTodayDateStr();
    const storedDate = localStorage.getItem(dateKey);
    if (storedDate !== today) {
      // si la fecha guardada no es hoy, reiniciar usados ahora
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(usuarioActual));
      try { localStorage.setItem(dateKey, today); } catch {}
    }

    // programar reinicio justo a la próxima medianoche
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();
    const timer = setTimeout(() => {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(usuarioActual));
      try { localStorage.setItem(dateKey, getTodayDateStr()); } catch {}
    }, msUntilMidnight);

    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [usuarioActual]);

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

  // --- NUEVO: Control mensual para inventariosobra ---
  useEffect(() => {
    // Solo para el botón de inventariosobra
    const monthKey = getCurrentMonthKey();
    const saved = localStorage.getItem("bomberman_inventariosobra_respuestas");
    let shouldClear = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isFirstDayOfMonth() || parsed.monthKey !== monthKey) {
          shouldClear = true;
        }
      } catch {
        shouldClear = true;
      }
    }
    if (shouldClear) {
      // Limpiar progreso solo para inventariosobra
      setUsados(prev => {
        if (!prev.inventariosobra) return prev;
        const nuevos = { ...prev, inventariosobra: false };
        setUsadosToStorage(nuevos, usuarioActual);
        return nuevos;
      });
    }
    // eslint-disable-next-line
  }, []);
  // --- FIN NUEVO ---

  // Barra de progreso (ajustar para contar inventariosobra solo si está vigente este mes)
  const monthKey = getCurrentMonthKey();
  const savedInv = localStorage.getItem("bomberman_inventariosobra_respuestas");
  let inventarioObraVigente = false;
  if (savedInv) {
    try {
      const parsed = JSON.parse(savedInv);
      if (parsed.monthKey === monthKey) {
        inventarioObraVigente = true;
      }
    } catch {}
  }
  // Ajustar usados para barra y color
  const usadosParaBarra = { ...usados, inventariosobra: inventarioObraVigente ? true : false };
  const total = 8; // ahora hay 9 formularios
  const completados = Object.values({
    ...usadosParaBarra,
    hora_ingreso: usados.hora_ingreso,
    hora_salida: usados.hora_salida
  }).filter(Boolean).length;
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
          {/* Hora de ingreso - primero */}
          <button
            className={getButtonClass(usados.hora_ingreso)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/hora_ingreso", "hora_ingreso")}
          >
            Hora de Ingreso
          </button>
          <p className="label" style={{ marginBottom: 20, fontSize: 20 }}>
            Diario
          </p>
          <button
            className={getButtonClass(usados.permiso_trabajo)}
            style={{ maxWidth: 320 }}
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
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/checklist", "checklist")}
          >
            Checklist 
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
            Chequeo Alturas 
          </button>
          <button
            className={getButtonClass(usados.inspeccion_epcc_bomberman)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/inspeccion_epcc_bomberman", "inspeccion_epcc_bomberman")}
          >
            Inspección EPCC 
          </button>
          <p className="label" style={{ marginBottom: 20, fontSize: 20 }}>
            Mensual
          </p>
          <button
            className={inventarioObraVigente ? "button button-green" : "button"}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/inventariosobra", "inventariosobra")}
          >
            Inventario de Obra 
          </button>
          {/* Hora de salida - último */}
          <button
            className={getButtonClass(usados.hora_salida)}
            style={{ maxWidth: 320, marginTop: 16 }}
            onClick={() => handleNavigate("/hora_salida", "hora_salida")}
          >
            Hora de Salida
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
      <Route path="/hora_ingreso" element={<HoraIngreso />} />
      <Route path="/planillabombeo" element={<PlanillaDeBombeo />} />
      <Route path="/checklist" element={<Checklist />} />
      <Route path="/inventariosobra" element={<InventariosObra />} />
      <Route path="/administrador" element={<Administrador />} />
      <Route path="/administrador_bomberman" element={<AdministradorBomberman />} />
      <Route path="/permiso_trabajo" element={<PermisoTrabajo />} />
      <Route path="/chequeo_alturas" element={<ChequeoAlturas />} />
      <Route path="/inspeccion_epcc_bomberman" element={<inspeccionEpccBomberman />} />
      <Route path="/hora_salida" element={<HoraSalida />} />
    </Routes>
  );
}

export default EleccionAIC;
