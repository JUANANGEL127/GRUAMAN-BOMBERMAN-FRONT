import React, { useState } from "react";
import CedulaIngreso from "./CedulaIngreso";
import BienvenidaSeleccion from "./BienvenidaSeleccion";
import "./App.css";

/**
 * Formulario de portada y registro de datos básicos con estructura y clases compatibles con permiso_trabajo.css
 */
function App() {
  const [usuario, setUsuario] = useState(null);

  return (
    !usuario ? (
      <CedulaIngreso onUsuarioEncontrado={setUsuario} />
    ) : (
      <BienvenidaSeleccion usuario={usuario} />
    )
  );
}

export default App;