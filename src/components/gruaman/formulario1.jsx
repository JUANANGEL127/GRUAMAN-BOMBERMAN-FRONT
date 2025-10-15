import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/formulario1.css";

// Componente principal para el registro de jornada
function formulario_1() {
  const navigate = useNavigate();
  const [hora_seleccionada, set_hora_seleccionada] = useState("");
  const [minuto_seleccionado, set_minuto_seleccionado] = useState("");
  const [ampm_seleccionado, set_ampm_seleccionado] = useState("");
  const [mensaje, set_mensaje] = useState("");
  const [trabajador_id, set_trabajador_id] = useState(null);

  // Datos del trabajador desde localStorage
  const nombre_trabajador = localStorage.getItem("nombre_trabajador") || "";
  const empresa = localStorage.getItem("empresa") || "";
  const obra = localStorage.getItem("obra") || "";
  const numero_identificacion = localStorage.getItem("numero_identificacion") || "";

  const api_url = "http://localhost:3000/formulario_1";

  // Obtener trabajador_id desde el backend
  useEffect(() => {
    const fetch_trabajador_id = async () => {
      if (nombre_trabajador && empresa && obra && numero_identificacion) {
        try {
          const res = await axios.get(
            `http://localhost:3000/trabajador-id?nombre=${encodeURIComponent(
              nombre_trabajador
            )}&empresa=${encodeURIComponent(empresa)}&obra=${encodeURIComponent(
              obra
            )}&numero_identificacion=${encodeURIComponent(numero_identificacion)}`
          );
          set_trabajador_id(res.data.trabajador_id);
        } catch (err) {
          set_trabajador_id(null);
        }
      }
    };
    fetch_trabajador_id();
  }, [nombre_trabajador, empresa, obra, numero_identificacion]);

  // Opciones para hora y minuto
  const horas_opciones = Array.from({ length: 12 }, (_, i) =>
    String(i === 0 ? 12 : i).padStart(2, "0")
  );
  const minutos_opciones = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  // Guardar registro de entrada/salida en el backend
  const guardar_registro = async () => {
    let hora_24 = "";
    let tipo = "";
    if (hora_seleccionada && minuto_seleccionado && ampm_seleccionado) {
      let hora_num = parseInt(hora_seleccionada, 10);
      if (ampm_seleccionado === "PM" && hora_num !== 12) {
        hora_num += 12;
      } else if (ampm_seleccionado === "AM" && hora_num === 12) {
        hora_num = 0;
      }
      hora_24 =
        String(hora_num).padStart(2, "0") +
        ":" +
        minuto_seleccionado +
        ":00";
      tipo = ampm_seleccionado === "AM" ? "entrada" : "salida";
    }
    if (!trabajador_id) {
      set_mensaje(
        "No se pudo obtener el trabajador_id. Verifica tus datos básicos."
      );
      return;
    }
    try {
      await axios.post(`${api_url}/registros`, {
        trabajador_id,
        hora_usuario: hora_24,
        tipo,
      });
      set_mensaje(`Registro de ${tipo} guardado correctamente.`);
      set_hora_seleccionada("");
      set_minuto_seleccionado("");
      set_ampm_seleccionado("");
    } catch (err) {
      set_mensaje("Error al guardar registro");
    }
  };

  // Renderizado del formulario
  return (
    <div className="app-container">
      <button
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 28,
          color: "#1976d2",
        }}
        onClick={() => navigate("/eleccion")}
        aria-label="Volver"
      >
        ←
      </button>
      <h2>Registro de Jornada</h2>
      <div className="app-group">
        <label className="app-label">Hora: </label>
        <div
          style={{
            display: "flex",
            gap: "10px",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <select
            className="app-select app-hora-select"
            value={hora_seleccionada}
            onChange={(e) => set_hora_seleccionada(e.target.value)}
            style={{ maxWidth: "90px" }}
          >
            <option value="">Hora</option>
            {horas_opciones.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <span
            style={{
              alignSelf: "center",
              fontWeight: "bold",
              color: "#1976d2",
            }}
          >
            :
          </span>
          <select
            className="app-select app-minuto-select"
            value={minuto_seleccionado}
            onChange={(e) => set_minuto_seleccionado(e.target.value)}
            style={{ maxWidth: "90px" }}
          >
            <option value="">Minuto</option>
            {minutos_opciones.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            className="app-select app-ampm-select"
            value={ampm_seleccionado}
            onChange={(e) => set_ampm_seleccionado(e.target.value)}
            style={{ maxWidth: "70px" }}
          >
            <option value="">AM/PM</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
      <button className="app-boton" onClick={guardar_registro}>
        Guardar Registro
      </button>
      <p className="app-mensaje">{mensaje}</p>
    </div>
  );
}

export default formulario_1;
