import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { todayStrBogota, hourMinuteBogota } from "../../utils/dateUtils";
import { acquireCurrentGeolocation } from "../../utils/geolocation";
import "../../styles/permiso_trabajo.css";

function getDatosTrabajador() {
  return {
    nombre: localStorage.getItem("nombre_trabajador") || "",
    cedula: localStorage.getItem("cedula_trabajador") || localStorage.getItem("cedula") || "",
    cargo: localStorage.getItem("cargo_trabajador") || "",
    empresa: localStorage.getItem("empresa_trabajador") || "",
    obra: localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "",
  };
}

export default function HoraSalida() {
  const navigate = useNavigate();
  const [datos] = useState(getDatosTrabajador());
  const [horaSalida, setHoraSalida] = useState("");
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  const [generales, setGenerales] = useState({
    cliente: "",
    proyecto: datos.obra,
    fecha: todayStrBogota(),
    operador: datos.nombre,
    cargo: datos.cargo,
  });

  useEffect(() => {
    const nombre_proyecto = localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "";
    const nombre_operador = localStorage.getItem("nombre_trabajador") || "";
    const fechaHoy = todayStrBogota();
    const cargo = localStorage.getItem("cargo_trabajador") || "";

    api.get("/obras")
      .then((res) => {
        const obras = Array.isArray(res.data?.obras) ? res.data.obras : [];
        const obra_seleccionada = obras.find((o) => o.nombre_obra === nombre_proyecto);
        const constructora = obra_seleccionada ? obra_seleccionada.constructora : "";
        setGenerales({
          cliente: constructora,
          proyecto: nombre_proyecto,
          operador: nombre_operador,
          fecha: fechaHoy,
          cargo,
        });
      })
      .catch(() => {
        setGenerales({
          cliente: "",
          proyecto: nombre_proyecto,
          operador: nombre_operador,
          fecha: fechaHoy,
          cargo,
        });
      });
  }, []);

  const handleRegistrarHora = () => {
    setHoraSalida(`${hourMinuteBogota()}:00`);
  };

  const handleGuardar = async () => {
    setError("");

    if (!generales.proyecto || !generales.fecha || !generales.operador || !horaSalida) {
      setError("Faltan parámetros obligatorios. Verificá que tu nombre, obra y hora estén cargados.");
      return;
    }

    try {
      const geo = await acquireCurrentGeolocation();
      console.log("[hora_salida] GPS sample:", geo);

      if (!Number.isFinite(geo?.lat) || !Number.isFinite(geo?.lon)) {
        console.error("[hora_salida] Invalid GPS sample, aborting submit:", geo);
        setError("No pudimos obtener coordenadas válidas. Activá ubicación y volvé a intentar.");
        return;
      }

      const obraId = Number(localStorage.getItem("obra_id"));

      const payload = {
        nombre_operador: generales.operador,
        fecha_servicio: todayStrBogota(),
        hora_salida: hourMinuteBogota(),
        lat: geo.lat,
        lon: geo.lon,
        accuracy_meters: geo.accuracy_meters,
        obra_id: Number.isFinite(obraId) && obraId > 0 ? obraId : undefined,
      };

      console.log("[hora_salida] Payload before POST /horas_jornada/salida:", payload);
      console.log("[hora_salida] Request includes lat/lon:", {
        hasLat: Number.isFinite(payload.lat),
        hasLon: Number.isFinite(payload.lon),
      });

      await api.post("/horas_jornada/salida", payload);
      setGuardado(true);
      setTimeout(() => navigate(-1), 500);
    } catch (e) {
      console.error("[hora_salida] Failed to register salida:", e);
      if (e?.code === 1) return setError("Necesitamos permiso de ubicación para registrar la salida.");
      if (e?.code === 3) return setError("No pudimos capturar ubicación a tiempo. Reintentá.");
      if (e?.response?.status === 400) return setError("Faltan coordenadas. Activá ubicación y volvé a intentar.");
      if (e?.response?.status === 403) {
        return setError(e?.response?.data?.message || e?.response?.data?.error || "Estás fuera del rango permitido de la obra.");
      }
      if (e?.response?.status === 404) return setError("No hay ingreso abierto para cerrar. Evitá reintentos ciegos.");

      setError(e?.response?.data?.error || e?.response?.data?.message || "Error de red al guardar");
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: 420, margin: "0 auto", padding: 24 }}>
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Datos generales</h2>
        <div className="datos-generales">
          <div><b>Cliente:</b> {generales.cliente}</div>
          <div><b>Obra:</b> {generales.proyecto}</div>
          <div><b>Fecha:</b> {generales.fecha}</div>
          <div><b>Trabajador:</b> {generales.operador}</div>
          <div><b>Cargo:</b> {generales.cargo}</div>
        </div>
      </div>
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Registro de hora de salida</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontWeight: 500 }}>Hora registrada:</label>
          <div className="input" style={{ marginTop: 6, fontSize: 20, textAlign: "center", fontWeight: 600, minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {horaSalida || "--:--:--"}
          </div>
        </div>
        <button className="button" style={{ marginBottom: 12, width: "100%" }} onClick={handleRegistrarHora} disabled={!!horaSalida}>
          Registrar hora actual
        </button>
      </div>
      <button className="button" style={{ width: "100%", background: "#1976d2", color: "#fff" }} onClick={handleGuardar} disabled={!horaSalida}>
        Guardar
      </button>
      {guardado && <div style={{ color: "#1976d2", marginTop: 16, textAlign: "center", fontWeight: 600 }}>¡Hora de salida registrada y guardada!</div>}
      {error && <div style={{ color: "#c00", marginTop: 16, textAlign: "center", fontWeight: 600 }}>{error}</div>}
    </div>
  );
}
