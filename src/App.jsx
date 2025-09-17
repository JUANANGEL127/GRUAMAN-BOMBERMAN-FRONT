import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import axios from "axios";

function App() {
  const [nombreTrabajador, setNombreTrabajador] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [obra, setObra] = useState("");
  const [numeroIdentificacion, setNumeroIdentificacion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const handleGuardar = async () => {
    try {
      await axios.post("http://localhost:3000/datos-basicos", {
        nombre: nombreTrabajador,
        empresa,
        obra,
        numero_identificacion: numeroIdentificacion,
      });
      localStorage.setItem("nombreTrabajador", nombreTrabajador);
      localStorage.setItem("empresa", empresa);
      localStorage.setItem("obra", obra);
      localStorage.setItem("numeroIdentificacion", numeroIdentificacion);
      setMensaje("Datos guardados correctamente.");
      setTimeout(() => {
        navigate("/eleccion");
      }, 500);
    } catch (err) {
      setMensaje("Error al guardar datos");
    }
  };

  return (
    <div className="app-container">
      <h2>Déjanos conocerte</h2>
      <div className="app-group">
        <label className="app-label">¿Cuál es tu nombre?</label>
        <input
          className="app-input"
          type="text"
          value={nombreTrabajador}
          onChange={e => setNombreTrabajador(e.target.value)}
        />
      </div>
      <div className="app-group">
        <label className="app-label">¿Cómo es tu número de identificación</label>
        <input
          className="app-input"
          type="text"
          value={numeroIdentificacion}
          onChange={e => setNumeroIdentificacion(e.target.value)}
        />
      </div>
      <div className="app-group">
        <label className="app-label">¿Tu eres?...</label>
      </div>
      <div className="app-group" style={{ flexDirection: "row", justifyContent: "center", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <button
            type="button"
            className={`app-boton empresa-boton${empresa === "GyE" ? " selected" : ""}`}
            style={{
              maxWidth: "140px",
              height: "140px",
              padding: 0,
              background: empresa === "GyE" ? "#1976d2" : undefined,
              border: empresa === "GyE" ? "2px solid #1976d2" : "2px solid #90caf9"
            }}
            onClick={() => setEmpresa("GyE")}
          >
            <img src="/gruaman.png" alt="GyE" className="empresa-img" style={{ width: "115px", height: "115px" }} />
          </button>
          <span className="app-label" style={{ marginTop: "8px" }}>GruaMan</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <button
            type="button"
            className={`app-boton empresa-boton${empresa === "AIC" ? " selected" : ""}`}
            style={{
              maxWidth: "220px",
              height: "140px",
              padding: 0,
              background: empresa === "AIC" ? "#ffa726" : undefined,
              border: empresa === "AIC" ? "2px solid #ffa726" : "2px solid #90caf9"
            }}
            onClick={() => setEmpresa("AIC")}
          >
            <img src="/bomberman.png" alt="AIC" className="empresa-img" style={{ width: "161px", height: "115px" }} />
          </button>
          <span className="app-label" style={{ marginTop: "8px" }}>BomberMan</span>
        </div>
      </div>
      <div className="app-group">
        <label className="app-label">¿En qué obra estás trabajando?</label>
        <input
          className="app-input"
          type="text"
          value={obra}
          onChange={e => setObra(e.target.value)}
        />
      </div>
      <button className="app-boton" onClick={handleGuardar} disabled={!nombreTrabajador || !empresa || !obra || !numeroIdentificacion}>
        Guardar
      </button>
      <p className="app-mensaje">{mensaje}</p>
    </div>
  );
}

export default App;
