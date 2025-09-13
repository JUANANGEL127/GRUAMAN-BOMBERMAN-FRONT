import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Eleccion from "./components/eleccion";
import Formulario1 from "./components/formulario1";
import Administrador from "./components/administrador";
import Epps from "./components/epps";
import Footer from "./components/Footer";
import { BrowserRouter, Routes, Route } from "react-router-dom";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <div style={{ minHeight: "100vh" }}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/eleccion/*" element={<Eleccion />} />
          <Route path="/formulario1" element={<Formulario1 />} />
          <Route path="/administrador" element={<Administrador />} />
          <Route path="/epps" element={<Epps />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);

