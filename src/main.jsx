import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Eleccion from "./components/gruaman/eleccion";
import EleccionAIC from "./components/bomberman/eleccionaic";
import Formulario1 from "./components/gruaman/formulario1";
import PlanillaBombeo from "./components/bomberman/planillabombeo";
import Checklist from "./components/bomberman/checklist";
import InventarioObra from "./components/bomberman/inventariosobra";
import Administrador from "./components/administrador";
import Footer from "./components/Footer";
import { BrowserRouter, Routes, Route } from "react-router-dom";


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
          <Route path="/inventariosobra/*" element={<InventarioObra />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);

