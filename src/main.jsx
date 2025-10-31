import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Eleccion from "./components/gruaman/eleccion";
import EleccionAIC from "./components/bomberman/eleccionaic";
import Formulario1 from "./components/gruaman/formulario1";
import PlanillaBombeo from "./components/bomberman/planillabombeo";
import Checklist from "./components/bomberman/checklist";
import InventarioObra from "./components/bomberman/inventariosobra";
import Administrador from "./components/administrador_gruaman/administrador";
import Footer from "./components/Footer";
import PermisoTrabajo from "./components/compartido/permiso_trabajo";
import ChequeoAlturas from "./components/compartido/chequeo_alturas";
import ChequeoTorreGruas from "./components/gruaman/chequeo_torregruas";
import InspeccionEPCC from "./components/gruaman/inspeccion_epcc";
import InspeccionIzaje from "./components/gruaman/inspeccion_izaje";
import InspeccionEPCCBomberman from "./components/bomberman/inspeccion_epcc_bomberman";
import ChequeoElevador from "./components/gruaman/chequeo_elevador";
import CedulaIngreso from "./CedulaIngreso";
import BienvenidaSeleccion from "./BienvenidaSeleccion";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import PermisoTrabajoAdmin from "./components/administrador_gruaman/permiso_trabajo_admin";
import LlegadaSalidaAdmin from "./components/administrador_gruaman/llegada_salida_admin";
import ChequeoAlturasAdmin from "./components/administrador_gruaman/chequeo_alturas_admin";
import ChequeoTorreGruasAdmin from "./components/administrador_gruaman/chequeo_torregruas_admin";
import ChequeoElevadorAdmin from "./components/administrador_gruaman/chequeo_elevador_admin";
import InspeccionEPCCAdmins from "./components/administrador_gruaman/inspeccion_EPCC_admins";
import InspeccionIzajeAdmin from "./components/administrador_gruaman/inspeccion_izaje_admin";
import AdministradorBomberman from "./components/administrador_bomberman/administrador_bomberman";
import PlanillaBombeoAdmin from "./components/administrador_bomberman/planilla_bombeo_admin";
import InventariosObraAdmin from "./components/administrador_bomberman/inventarios_obra_admin";
import ChecklistAdmin from "./components/administrador_bomberman/checklist_admin";
import InspeccionEPCCBombermanAdmin from "./components/administrador_bomberman/inspeccion_epcc_bomberman_admin";
import AdminUsuarios from "./components/administrador_gruaman/admin_usuarios";
import AdminUsuariosBomberman from "./components/administrador_bomberman/admin_usuarios_bomberman";
import AdminsObras from "./components/administrador_gruaman/admins_obras";
import AdminObrasBomberman from "./components/administrador_bomberman/admin_obras_bomberman";

// Función para obtener usuario y obra de localStorage
function getUsuarioObra() {
  let usuario = "";
  let obra = "";

  // Usuario: primero intenta con nombre_trabajador, luego usuario
  const nombreTrabajador = localStorage.getItem("nombre_trabajador");
  if (nombreTrabajador && nombreTrabajador.trim()) {
    usuario = nombreTrabajador;
  } else {
    const usuarioStorage = localStorage.getItem("usuario");
    if (usuarioStorage) {
      try {
        const usuarioParsed = JSON.parse(usuarioStorage);
        if (usuarioParsed && typeof usuarioParsed === "object" && usuarioParsed.nombre) {
          usuario = usuarioParsed.nombre;
        } else if (typeof usuarioParsed === "string") {
          usuario = usuarioParsed;
        } else {
          usuario = usuarioStorage;
        }
      } catch {
        usuario = usuarioStorage;
      }
    }
  }

  // Obra: primero intenta con obra, luego nombre_proyecto
  const obraStorage = localStorage.getItem("obra");
  if (obraStorage && obraStorage.trim()) {
    obra = obraStorage;
  } else {
    const nombreProyecto = localStorage.getItem("nombre_proyecto");
    if (nombreProyecto && nombreProyecto.trim()) {
      obra = nombreProyecto;
    } else {
      try {
        const obraParsed = JSON.parse(obraStorage);
        if (obraParsed && typeof obraParsed === "object" && obraParsed.nombre) {
          obra = obraParsed.nombre;
        } else if (typeof obraParsed === "string") {
          obra = obraParsed;
        }
      } catch {
        obra = obraStorage;
      }
    }
  }

  return { usuario, obra };
}

// Componente del botón SOS flotante
function SOSButton() {
  const [enviando, setEnviando] = React.useState(false);
  const [mensaje, setMensaje] = React.useState("");

  const enviarSOS = async () => {
    setEnviando(true);
    setMensaje("");
    const { usuario, obra } = getUsuarioObra();
    if (!usuario || !obra) {
      setMensaje("No se encontró usuario u obra en localStorage.");
      setEnviando(false);
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/emergencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, ubicacion: obra }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error del servidor: ${res.status} ${errorText}`);
        setMensaje("Error al enviar mensaje.");
      } else {
        await res.json();
        setMensaje("¡Mensaje de emergencia enviado!");
      }
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      setMensaje("Error al enviar mensaje.");
    }
    setEnviando(false);
  };

  return (
    <>
      <button
        style={{
          position: "fixed",
          left: 14,
          bottom: "80px",
          zIndex: 1000,
          borderRadius: "50%",
          width: 64,
          height: 64,
          background: "#c00",
          color: "#fff",
          border: "none",
          fontSize: 24,
          fontWeight: "bold",
          boxShadow: "0 2px 12px #c00",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          lineHeight: "1",
        }}
        onClick={enviarSOS}
        disabled={enviando}
        title="SOS Emergencia"
      >
        <span style={{ fontSize: 24, fontWeight: "bold", color: "#fff", letterSpacing: 2 }}>SOS</span>
      </button>
      {mensaje && (
        <div
          style={{
            position: "fixed",
            left: 14,
            bottom: "150px",
            zIndex: 1100,
            background: "#fff",
            border: "2px solid #c00",
            borderRadius: 12,
            padding: "8px 16px",
            boxShadow: "0 2px 8px #c00",
            minWidth: 220,
            color: mensaje.includes("Error") ? "#c00" : "#1976d2",
            fontWeight: "bold",
            textAlign: "center"
          }}
        >
          {mensaje}
        </div>
      )}
    </>
  );
}

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
        <SOSButton />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/cedula" element={<CedulaIngreso />} />
            <Route path="/bienvenida" element={<BienvenidaSeleccion usuario={{ nombre: "Invitado", empresa: "GyE" }} />} />
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
            <Route path="/chequeo_elevador" element={<ChequeoElevador />} />
            <Route path="/inspeccion_epcc" element={<InspeccionEPCC />} />
            <Route path="/inspeccion_izaje" element={<InspeccionIzaje />} />
            <Route path="/inspeccion_epcc_bomberman" element={<InspeccionEPCCBomberman />} />
            <Route path="/permiso_trabajo_admin" element={<PermisoTrabajoAdmin />} />
            <Route path="/llegada_salida_admin" element={<LlegadaSalidaAdmin />} />
            <Route path="/chequeo_alturas_admin" element={<ChequeoAlturasAdmin />} />
            <Route path="/chequeo_torregruas_admin" element={<ChequeoTorreGruasAdmin />} />
            <Route path="/chequeo_elevador_admin" element={<ChequeoElevadorAdmin />} />
            <Route path="/inspeccion_EPCC_admins" element={<InspeccionEPCCAdmins />} />
            <Route path="/inspeccion_izaje_admin" element={<InspeccionIzajeAdmin />} />
            <Route path="/administrador_bomberman" element={<AdministradorBomberman />} />
            <Route path="/planilla_bombeo_admin" element={<PlanillaBombeoAdmin />} />
            <Route path="/inventarios_obra_admin" element={<InventariosObraAdmin />} />
            <Route path="/checklist_admin" element={<ChecklistAdmin />} />
            <Route path="/inspeccion_epcc_bomberman_admin" element={<InspeccionEPCCBombermanAdmin />} />
            <Route path="/admin_usuarios" element={<AdminUsuarios />} />
            <Route path="/admin_usuarios_bomberman" element={<AdminUsuariosBomberman />} />
            <Route path="/admins_obras" element={<AdminsObras />} />
            <Route path="/admin_obras_bomberman" element={<AdminObrasBomberman />} />
          </Routes>
          {/* <Footer /> */}
        </div>
      </div>
    </BrowserRouter>
  </React.StrictMode>
);

