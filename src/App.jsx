import React, { useState } from "react";
import CedulaIngreso from "./CedulaIngreso";
import BienvenidaSeleccion from "./BienvenidaSeleccion";
import "./App.css";
import InstallPWAButton from "./components/InstallPWAButton";

/**
 * Formulario de portada y registro de datos básicos con estructura y clases compatibles con permiso_trabajo.css
 */
function App() {
  const [usuario, setUsuario] = useState(null);

  return (
    <>
      {
        !usuario ? (
          <CedulaIngreso onUsuarioEncontrado={setUsuario} />
        ) : (
          <BienvenidaSeleccion usuario={usuario} />
        )
      }
      <InstallPWAButton />
    </>
  );
}

export default App;