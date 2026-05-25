import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Checklist from "../bomberman/checklist";
import InventariosObra from "../bomberman/inventariosobra";
import "../../App.css";
import HoraIngreso from "../compartido/horada_ingreso";
import HoraSalida from "../compartido/hora_salida";
import { markWorldComplete } from '../../db/gameProgress';
import { useAuth } from "../../features/auth/hooks/useAuth";
import {
  API_CONTROLLED_FORMAT_KEYS,
  fetchRequiredFormatsStatus,
} from "../../utils/requiredFormatsStatus";


/**
 * @param {string} usuario
 * @returns {Object} Map of worldId → boolean
 */
function getUsadosFromStorage(usuario) {
  try {
    const data = localStorage.getItem(`lideres_usados_${usuario}`);
    if (data) return JSON.parse(data);
  } catch {}
  return {
    hora_ingreso: false,
    checklist: false,
    inventariosobra: false,
    hora_salida: false
  };
}

function setUsadosToStorage(usados, usuario) {
  localStorage.setItem(`lideres_usados_${usuario}`, JSON.stringify(usados));
}

function limpiarUsados(usuario) {
  localStorage.removeItem(`lideres_usados_${usuario}`);
  try { localStorage.removeItem(`lideres_usados_date_${usuario}`); } catch {}
}

/** @returns {string} YYYY-MM-DD date in America/Bogota timezone */
function getTodayDateStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
}

/**
 * BienvenidaLideres — selector de misiones para el rol Líderes (supervisores).
 * Rastrea el uso diario de misiones por usuario y se reinicia a medianoche.
 */
function BienvenidaLideres() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    const worldId = localStorage.getItem('game_mode_completed');
    if (worldId) {
      localStorage.removeItem('game_mode_completed');
      localStorage.removeItem('game_mode');
      markWorldComplete(worldId);
      navigate('/game/world-map', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nombre = localStorage.getItem("nombre_trabajador") || "";

  const usuario = nombre || "anonimo";
  const [usados, setUsados] = useState(() => getUsadosFromStorage(usuario));
  const [usuarioActual, setUsuarioActual] = useState(usuario);

  useEffect(() => {
    let cancelled = false;
    fetchRequiredFormatsStatus()
      .then((requiredStatus) => {
        if (cancelled) return;
        setUsados((prev) => ({ ...prev, ...requiredStatus }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [usuarioActual]);

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
    try { localStorage.setItem(`lideres_usados_date_${usuarioActual}`, getTodayDateStr()); } catch {}
  }, [usados, usuarioActual]);

  useEffect(() => {
    const dateKey = `lideres_usados_date_${usuarioActual}`;
    const today = getTodayDateStr();
    const storedDate = localStorage.getItem(dateKey);
    if (storedDate !== today) {
      limpiarUsados(usuarioActual);
      setUsados(getUsadosFromStorage(usuarioActual));
      try { localStorage.setItem(dateKey, today); } catch {}
    }

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
    if (API_CONTROLLED_FORMAT_KEYS.has(key)) {
      navigate(ruta);
      return;
    }
    setUsados(prev => {
      const nuevos = { ...prev, [key]: true };
      setUsadosToStorage(nuevos, usuarioActual);
      return nuevos;
    });
    navigate(ruta);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getButtonClass = (usado) =>
    usado ? "button button-green" : "button";

  const total = 4; // 4 formularios: hora_ingreso, checklist, inventariosobra, hora_salida
  const completados = Object.values(usados).filter(Boolean).length;
  const porcentaje = Math.round((completados / total) * 100);

  return (
    <div className="form-container">
      <div className="card-section">
        <h3 className="card-title">
          Bienvenido Líder{nombre ? ` ${nombre}` : ""}
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
          <button
            className={getButtonClass(usados.checklist)}
            style={{ maxWidth: 320 }}
            onClick={() => handleNavigate("/checklist", "checklist")}
          >
            Checklist
          </button>
          <button
            className={getButtonClass(usados.inventariosobra)}
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
              background: "#ff9800",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              opacity: 1
            }}
            onClick={handleSignOut}
          >Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}

function EleccionLideres() {
  return (
    <Routes>
      <Route path="/" element={<BienvenidaLideres />} />
      <Route path="/hora_ingreso" element={<HoraIngreso />} />
      <Route path="/checklist" element={<Checklist />} />
      <Route path="/inventariosobra" element={<InventariosObra />} />
      <Route path="/hora_salida" element={<HoraSalida />} />
    </Routes>
  );
}

export default EleccionLideres;

