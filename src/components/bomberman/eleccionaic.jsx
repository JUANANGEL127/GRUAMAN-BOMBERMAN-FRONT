import { Routes, Route, useNavigate } from "react-router-dom";
import PlanillaDeBombeo from "./planillabombeo";
import Checklist from "./checklist";
import InventariosObra from "./inventariosobra";
import Administrador from "../administrador";
import "../../App.css";

function EleccionAIC() {
  return (
    <Routes>
      <Route path="/" element={<BienvenidaAIC />} />
      <Route path="/planillabombeo" element={<PlanillaDeBombeo />} />
      <Route path="/checklist" element={<Checklist />} />
      <Route path="/inventariosobra" element={<InventariosObra />} />
      <Route path="/administrador" element={<Administrador />} />
    </Routes>
  );
}

function BienvenidaAIC() {
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
        onClick={() => navigate("/planillabombeo")}
      >
        Planilla de Bombeo
      </button>
      <button
        className="app-boton"
        style={{ maxWidth: 320, marginTop: 18 }}
        onClick={() => navigate("/checklist")}
      >
        Checklist
      </button>
      <button
        className="app-boton"
        style={{ maxWidth: 320, marginTop: 18 }}
        onClick={() => navigate("/inventariosobra")}
      >
        Inventario de Obra
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

export default EleccionAIC;
