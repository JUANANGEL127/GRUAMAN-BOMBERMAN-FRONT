import { Routes, Route, useNavigate } from "react-router-dom";
import formulario1 from "./formulario1";
import administrador from "../administrador";
import ChecklistMentinimiento from "./checklist_mentinimiento_grua";
import ChecklistMantenimientoElevador from "./checklist_mantenimiento_elevador";
import ActaVisitaElevador from "./acta_visita_elevador";
import ActaVisitaGrua from "./acta_visita_grua";
import "../../App.css";

// Componente principal para la selección de formularios Gruaman
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
      <button
        className="app-boton"
        style={{ maxWidth: 320, marginTop: 18 }}
        onClick={() => navigate("/checklist_mentinimiento")}
      >
        Checklist Mentinimiento Grua
      </button>
      <button
        className="app-boton"
        style={{ maxWidth: 320, marginTop: 18 }}
        onClick={() => navigate("/checklist_mentinimiento_elevador")}
      >
        Checklist Mantenimiento Elevador
      </button>
      <button
        className="app-boton"
        style={{ maxWidth: 320, marginTop: 18 }}
        onClick={() => navigate("/acta_visita_elevador")}
      >
        Acta Visita Elevador
      </button>
      <button
        className="app-boton"
        style={{ maxWidth: 320, marginTop: 18 }}
        onClick={() => navigate("/acta_visita_grua")}
      >
        Acta Visita Grua
      </button>
    </div>
  );
}

// Rutas para cada formulario
function eleccion() {
  return (
    <Routes>
      <Route path="/" element={<Bienvenida />} />
      <Route path="/formulario1" element={<formulario1 />} />
      <Route path="/administrador" element={<administrador />} />
      <Route path="/checklist_mentinimiento" element={<ChecklistMentinimiento />} />
      <Route path="/checklist_mentinimiento_elevador" element={<ChecklistMantenimientoElevador />} />
      <Route path="/acta_visita_elevador" element={<ActaVisitaElevador />} />
      <Route path="/acta_visita_grua" element={<ActaVisitaGrua />} />
    </Routes>
  );
}

export default eleccion;
