import { Routes, Route, useNavigate } from "react-router-dom";
import Formulario1 from "./formulario1";
import Administrador from "../administrador";
import "../../App.css";

function Eleccion() {
  return (
    <Routes>
      <Route path="/" element={<Bienvenida />} />
      <Route path="/formulario1" element={<Formulario1 />} />
      <Route path="/administrador" element={<Administrador />} />
    </Routes>
  );
}

function Bienvenida() {
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
        onClick={() => navigate("/formulario1")}
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

export default Eleccion;
