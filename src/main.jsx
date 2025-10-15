import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Eleccion from "./components/gruaman/eleccion";
import EleccionAIC from "./components/bomberman/eleccionaic";
import Formulario1 from "./components/gruaman/formulario1";
import PlanillaBombeo from "./components/bomberman/planillabombeo";
import Checklist from "./components/bomberman/checklist";
import ChecklistMentinimiento from "./components/gruaman/checklist_mentinimiento_grua";
import ChecklistMentinimientoElevador from "./components/gruaman/checklist_mantenimiento_elevador";
import InventarioObra from "./components/bomberman/inventariosobra";
import Administrador from "./components/administrador";
import Footer from "./components/Footer";
import ActaVisitaElevador from "./components/gruaman/acta_visita_elevador";
import ActaVisitaGrua from "./components/gruaman/acta_visita_grua";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Renderizado principal y rutas de la aplicación
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <div style={{ minHeight: "100vh" }}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/eleccion/*" element={<Eleccion />} />
          <Route path="/eleccionaic/*" element={<EleccionAIC />} />
          <Route path="/formulario1" element={<Formulario1 />} />
          <Route path="/administrador" element={<Administrador />} />
          <Route path="/planillabombeo" element={<PlanillaBombeo />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/checklist_mentinimiento" element={<ChecklistMentinimiento />} />
          <Route path="/checklist_mentinimiento_elevador" element={<ChecklistMentinimientoElevador />} />
          <Route path="/inventariosobra/*" element={<InventarioObra />} />
          <Route path="/acta_visita_elevador" element={<ActaVisitaElevador />} />
          <Route path="/acta_visita_grua" element={<ActaVisitaGrua />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);

