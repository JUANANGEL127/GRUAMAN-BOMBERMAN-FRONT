import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css"; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function getDatosTrabajador() {
  return {
    nombre: localStorage.getItem("nombre_trabajador") || "",
    cedula: localStorage.getItem("cedula_trabajador") || localStorage.getItem("cedula") || "",
    cargo: localStorage.getItem("cargo_trabajador") || "",
    empresa: localStorage.getItem("empresa_trabajador") || "",
    obra: localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "",
  };
}

function getHoraColombia() {
  return new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Bogota"
  });
}

export default function HoraSalida() {
  const navigate = useNavigate();
  const [datos] = useState(getDatosTrabajador());
  const [horaSalida, setHoraSalida] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  const handleRegistrarHora = () => {
    setHoraSalida(getHoraColombia());
  };

  const handleGuardar = async () => {
    setError("");
    const nombre_operador = datos.nombre;
    const fecha_servicio = new Date().toISOString().slice(0, 10);
    const hora_salida = horaSalida.slice(0,5);
    const observaciones = "";

    const payload = {
      nombre_operador,
      fecha_servicio,
      hora_salida,
      observaciones
    };

    try {
      const resp = await fetch(`${API_BASE_URL}/horas_jornada/salida`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (resp.ok) {
        setGuardado(true);
        setTimeout(() => navigate(-1), 500);
      } else {
        setError(data.error || "Error al guardar");
      }
    } catch (e) {
      setError("Error de red al guardar");
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: 420, margin: "0 auto", padding: 24 }}>
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Datos generales</h2>
        <div className="datos-generales">
          <div><b>Nombre:</b> {datos.nombre}</div>
          <div><b>Cédula:</b> {datos.cedula}</div>
          <div><b>Obra:</b> {datos.obra}</div>
        </div>
      </div>
      {/* Registro de hora de salida */}
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Registro de hora de salida</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 500 }}>Hora registrada:</label>
          <div
            className="input"
            style={{
              marginTop: 6,
              fontSize: 20,
              background: "rgba(255,255,255,0.22)",
              borderRadius: "14px",
              boxShadow: "0 4px 16px 0 rgba(31, 38, 135, 0.18)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.28)",
              textAlign: "center",
              color: "#222",
              fontWeight: 600,
              minHeight: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              userSelect: "none"
            }}
          >
            {horaSalida || "--:--:--"}
          </div>
        </div>
        <button
          className="button"
          style={{ marginBottom: 12, width: "100%" }}
          onClick={handleRegistrarHora}
          disabled={!!horaSalida}
        >
          Registrar hora actual
        </button>
      </div>
      <button
        className="button"
        style={{ width: "100%", background: "#1976d2", color: "#fff" }}
        onClick={handleGuardar}
        disabled={!horaSalida}
      >
        Guardar
      </button>
      {guardado && (
        <div style={{ color: "#1976d2", marginTop: 16, textAlign: "center", fontWeight: 600 }}>
          ¡Hora de salida registrada y guardada!
        </div>
      )}
      {error && (
        <div style={{ color: "#c00", marginTop: 16, textAlign: "center", fontWeight: 600 }}>
          {error}
        </div>
      )}
    </div>
  );
}