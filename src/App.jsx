import { Routes, Route, useNavigate } from "react-router-dom";
import Formulario1 from "./components/formulario1";
import Administrador from "./components/administrador";
import "./App.css";

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


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Bienvenida />} />
        <Route path="/formulario1" element={<Formulario1 />} />
        <Route path="/administrador" element={<Administrador />} />
      </Routes>
      <footer className="app-footer">
        <img
          src="../public/logopiegye.png"
          alt="Logo GYE"
          className="footer-logo"
        />
        <img
          src="../public/logopieaica.png"
          alt="Logo AIC"
          className="footer-logo"
        />
      </footer>
    </>
  );
}

export default App;
