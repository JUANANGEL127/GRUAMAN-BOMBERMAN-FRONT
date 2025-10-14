import { Routes, Route, useNavigate } from "react-router-dom";
import formulario_1 from "./formulario1";
import administrador from "../administrador";
import "../../App.css";

function eleccion() {
  return (
    <Routes>
      <Route path="/" element={<bienvenida />} />
      <Route path="/formulario_1" element={<formulario_1 />} />
      <Route path="/administrador" element={<administrador />} />
    </Routes>
  );
}

function bienvenida() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <h2>Bienvenido</h2>
      <p className="app-label" style={{ marginBottom: 32 }}>
        Selecciona el formulario que deseas usar:
      </p>
      <button
        className="app-boton"
        style={{ maxWidth: 320 }}
        onClick={() => navigate("/formulario_1")}
      >
        Formulario de llegada y salida
      </button>
      <button
        className="app-boton"
        style={{ maxWidth: 320, marginTop: 18 }}
        onClick={() => navigate("/administrador")}
      >
        Panel Administrador
      </button>
    </div>
  );
}

export default eleccion;
