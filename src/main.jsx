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
import PermisoTrabajo from "./components/compartido/permiso_trabajo";
import ChequeoAlturas from "./components/compartido/chequeo_alturas";
import ChequeoTorreGruas from "./components/gruaman/chequeo_torregruas";
import InspeccionEPCC from "./components/gruaman/inspeccion_epcc";
import InspeccionIzaje from "./components/gruaman/inspeccion_izaje";
import InspeccionEPCCBomberman from "./components/bomberman/inspeccion_epcc_bomberman";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

// Renderizado principal y rutas de la aplicación
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <div
        style={{
          minHeight: "100vh",
          minWidth: "100vw",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0,
            backgroundImage: "url('/fondo.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/eleccion/*" element={<Eleccion />} />
            <Route path="/eleccionaic/*" element={<EleccionAIC />} />
            <Route path="/formulario1" element={<Formulario1 />} />
            <Route path="/administrador" element={<Administrador />} />
            <Route path="/planillabombeo" element={<PlanillaBombeo />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/inventariosobra/*" element={<InventarioObra />} />
            <Route path="/permiso_trabajo" element={<PermisoTrabajo />} />
            <Route path="/chequeo_alturas" element={<ChequeoAlturas />} />
            <Route path="/chequeo_torregruas" element={<ChequeoTorreGruas />} />
            <Route path="/inspeccion_epcc" element={<InspeccionEPCC />} />
            <Route path="/inspeccion_izaje" element={<InspeccionIzaje />} />
            <Route path="/inspeccion_epcc_bomberman" element={<InspeccionEPCCBomberman />} />
          </Routes>
          {/* <Footer /> */}
        </div>
      </div>
    </BrowserRouter>
  </React.StrictMode>
);

