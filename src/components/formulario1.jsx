import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/formulario1.css";


function Formulario1() {
  const navigate = useNavigate();
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [minutoSeleccionado, setMinutoSeleccionado] = useState("");
  const [ampmSeleccionado, setAmpmSeleccionado] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [trabajadorId, setTrabajadorId] = useState(null);

  const nombreTrabajador = localStorage.getItem("nombreTrabajador") || "";
  const empresa = localStorage.getItem("empresa") || "";
  const obra = localStorage.getItem("obra") || "";
  const numeroIdentificacion = localStorage.getItem("numeroIdentificacion") || "";

  const API_URL = "http://localhost:3000/formulario1";

  useEffect(() => {
    const fetchTrabajadorId = async () => {
      if (nombreTrabajador && empresa && obra && numeroIdentificacion) {
        try {
          const res = await axios.get(
            `http://localhost:3000/trabajador-id?nombre=${encodeURIComponent(
              nombreTrabajador
            )}&empresa=${encodeURIComponent(empresa)}&obra=${encodeURIComponent(
              obra
            )}&numero_identificacion=${encodeURIComponent(numeroIdentificacion)}`
          );
          setTrabajadorId(res.data.trabajadorId);
        } catch (err) {
          setTrabajadorId(null);
        }
      }
    };
    fetchTrabajadorId();
  }, [nombreTrabajador, empresa, obra, numeroIdentificacion]);

  const horasOpciones = Array.from({ length: 12 }, (_, i) =>
    String(i === 0 ? 12 : i).padStart(2, "0")
  );
  const minutosOpciones = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  // Enviar registro
  const guardarRegistro = async () => {
    // Convertir a formato 24 horas
    let hora24 = "";
    let tipo = "";
    if (horaSeleccionada && minutoSeleccionado && ampmSeleccionado) {
      let horaNum = parseInt(horaSeleccionada, 10);
      if (ampmSeleccionado === "PM" && horaNum !== 12) {
        horaNum += 12;
      } else if (ampmSeleccionado === "AM" && horaNum === 12) {
        horaNum = 0;
      }
      hora24 =
        String(horaNum).padStart(2, "0") +
        ":" +
        minutoSeleccionado +
        ":00";
      tipo = ampmSeleccionado === "AM" ? "entrada" : "salida";
    }
    if (!trabajadorId) {
      setMensaje(
        "No se pudo obtener el trabajadorId. Verifica tus datos básicos."
      );
      return;
    }
    try {
      await axios.post(`${API_URL}/registros`, {
        trabajadorId,
        hora_usuario: hora24,
        tipo,
      });
      setMensaje(`Registro de ${tipo} guardado correctamente.`);
      setHoraSeleccionada("");
      setMinutoSeleccionado("");
      setAmpmSeleccionado("");
    } catch (err) {
      setMensaje("Error al guardar registro");
      console.error(err);
    }
  };

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
            value={horaSeleccionada}
            onChange={(e) => setHoraSeleccionada(e.target.value)}
            style={{ maxWidth: "90px" }}
          >
            <option value="">Hora</option>
            {horasOpciones.map((h) => (
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
            value={minutoSeleccionado}
            onChange={(e) => setMinutoSeleccionado(e.target.value)}
            style={{ maxWidth: "90px" }}
          >
            <option value="">Minuto</option>
            {minutosOpciones.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            className="app-select app-ampm-select"
            value={ampmSeleccionado}
            onChange={(e) => setAmpmSeleccionado(e.target.value)}
            style={{ maxWidth: "70px" }}
          >
            <option value="">AM/PM</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
      <button className="app-boton" onClick={guardarRegistro}>
        Guardar Registro
      </button>
      <p className="app-mensaje">{mensaje}</p>
    </div>
  );
}

export default Formulario1;
