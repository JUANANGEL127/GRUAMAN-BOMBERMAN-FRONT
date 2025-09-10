import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [nombreTrabajador, setNombreTrabajador] = useState("");
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [minutoSeleccionado, setMinutoSeleccionado] = useState("");
  const [ampmSeleccionado, setAmpmSeleccionado] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [empresa, setEmpresa] = useState("");

  const API_URL = "http://localhost:3000"; // tu backend

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
      hora24 = String(horaNum).padStart(2, "0") + ":" + minutoSeleccionado + ":00";
      tipo = ampmSeleccionado === "AM" ? "entrada" : "salida";
    }
    try {
      await axios.post(`${API_URL}/registros`, {
        nombre: nombreTrabajador,
        hora_usuario: hora24,
        tipo,
        empresa,
      });
      setMensaje(`Registro de ${tipo} guardado correctamente.`);
      setHoraSeleccionada("");
      setMinutoSeleccionado("");
      setAmpmSeleccionado("");
      setEmpresa("");
    } catch (err) {
      setMensaje("Error al guardar registro");
      console.error(err);
    }
  };

  return (
    <>
      <div className="app-container">
        <h2>Registro de Jornada</h2>
        <div className="app-group">
          <label className="app-label">Nombre del trabajador: </label>
          <input
            className="app-input"
            type="text"
            value={nombreTrabajador}
            onChange={(e) => setNombreTrabajador(e.target.value)}
          />
        </div>
        <div className="app-group">
          <label className="app-label">Empresa</label>
        </div>
        <div className="app-group" style={{ flexDirection: "row", justifyContent: "center", gap: "16px" }}>
          <button
            type="button"
            className={`app-boton empresa-boton${empresa === "GyE" ? " selected" : ""}`}
            style={{ maxWidth: "80px", padding: 0, background: empresa === "GyE" ? "#1976d2" : undefined, border: empresa === "GyE" ? "2px solid #1976d2" : "2px solid #90caf9" }}
            onClick={() => setEmpresa("GyE")}
          >
            <img src="/botongye.png" alt="GyE" className="empresa-img" />
          </button>
          <button
            type="button"
            className={`app-boton empresa-boton${empresa === "AIC" ? " selected" : ""}`}
            style={{ maxWidth: "80px", padding: 0, background: empresa === "AIC" ? "#ffa726" : undefined, border: empresa === "AIC" ? "2px solid #ffa726" : "2px solid #90caf9" }}
            onClick={() => setEmpresa("AIC")}
          >
            <img src="/botonaic.png" alt="AIC" className="empresa-img" />
          </button>
        </div>
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
      <footer className="app-footer">
        <img
          src="../public/logopiegye.png"
          alt="Logo GYE"
          className="footer-logo"
        />
        <img
          src="../public/logopieaica.png"
          alt="Logo AIC"
          className="footer-logo"
        />
      </footer>
    </>
  );
}

export default App;
