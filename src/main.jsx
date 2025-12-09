import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Eleccion from "./components/gruaman/eleccion";
import EleccionAIC from "./components/bomberman/eleccionaic";
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
import HoraIngreso from "./components/compartido/horada_ingreso";
import HoraSalida from "./components/compartido/hora_salida";
import HorasExtraBombermanAdmin from "./components/administrador_bomberman/horas_extra_bomberman";
import HorasExtraGruamanAdmin from "./components/administrador_gruaman/horas_extra_gruaman";

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

// Usa variable de entorno para la base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

// Componente del botón SOS flotante
function SOSButton() {
  const [enviando, setEnviando] = React.useState(false);
  const [mensaje, setMensaje] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);

  // Utilidad para obtener usuario y obra de localStorage
  function getUsuarioObra() {
    let usuario = "";
    let obra = "";
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

  // Handler para mostrar opciones SOS
  const handleSOS = () => {
    setShowModal(true);
    setMensaje("");
  };

  // Handler para llamar
  const handleLlamar = () => {
    setShowModal(false);
    window.location.href = "tel:573183485318";
  };

  // Handler para WhatsApp
  const handleWhatsApp = () => {
    setShowModal(false);
    const { usuario, obra } = getUsuarioObra();
    const baseUrl = "https://chat.whatsapp.com/F9SaM1zAVuw5EoS7SKQ6rK";
    // Mensaje predeterminado
    const mensaje = `Soy ${usuario || "un usuario"} en la obra ${obra || "desconocida"}, tuve un accidente o incidente`;
 
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mensaje);
      setTimeout(() => {
        window.location.href = baseUrl;
      }, 300);
      setMensaje("Mensaje copiado. Pega el mensaje en el grupo de WhatsApp.");
    } else {
      window.location.href = baseUrl;
      setMensaje("Copia y pega este mensaje en el grupo: " + mensaje);
    }
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
        onClick={handleSOS}
        disabled={enviando}
        title="SOS Emergencia"
      >
        <span style={{ fontSize: 24, fontWeight: "bold", color: "#fff", letterSpacing: 2 }}>SOS</span>
      </button>
     {showModal && (
       <div
         style={{
           position: "fixed",
           left: 0,
           top: 0,
           width: "100vw",
           height: "100vh",
           background: "rgba(0,0,0,0.25)",
           zIndex: 2000,
           display: "flex",
           alignItems: "center",
           justifyContent: "center"
         }}
         onClick={() => setShowModal(false)}
       >
         <div
           style={{
             background: "#fff",
             borderRadius: 14,
             boxShadow: "0 2px 12px #c00",
             padding: "24px 18px",
             minWidth: 220,
             display: "flex",
             flexDirection: "column",
             gap: 16,
             alignItems: "center"
           }}
           onClick={e => e.stopPropagation()}
         >
           <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>¿Qué deseas hacer?</div>
           <button
             className="permiso-trabajo-btn"
             style={{ background: "#c00", color: "#fff", minWidth: 120, fontWeight: 600 }}
             onClick={handleLlamar}
           >
             Llamar
           </button>
           <button
             className="permiso-trabajo-btn"
             style={{ background: "#25D366", color: "#fff", minWidth: 120, fontWeight: 600 }}
             onClick={handleWhatsApp}
           >
             Escribir mensaje
           </button>
           <button
             className="permiso-trabajo-btn"
             style={{ background: "#eee", color: "#222", minWidth: 120, fontWeight: 600 }}
             onClick={() => setShowModal(false)}
           >
             Cancelar
           </button>
         </div>
       </div>
     )}
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

// Componente del botón STP flotante
function STPButton() {
  const [showModal, setShowModal] = React.useState(false);
  const [showCallModal, setShowCallModal] = React.useState(false);
  const [mensaje, setMensaje] = React.useState("");

  // Utilidad para obtener usuario y obra de localStorage
  function getUsuarioObra() {
    let usuario = "";
    let obra = "";
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

  // Handler para mostrar opciones STP
  const handleSTP = () => {
    setShowModal(true);
    setMensaje("");
  };

  // Handler para WhatsApp grupo STP
  const handleWhatsApp = () => {
    setShowModal(false);
    const { usuario, obra } = getUsuarioObra();
    const baseUrl = "https://chat.whatsapp.com/FUZyTMGqpXu36uXHhUIAWh";
    const mensajeTexto = `Soy ${usuario || "un usuario"} en la obra ${obra || "desconocida"}, tuve un accidente o incidente`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mensajeTexto);
      setTimeout(() => {
        window.location.href = baseUrl;
      }, 300);
      setMensaje("Mensaje copiado. Pega el mensaje en el grupo de WhatsApp.");
    } else {
      window.location.href = baseUrl;
      setMensaje("Copia y pega este mensaje en el grupo: " + mensajeTexto);
    }
  };

  // Handler para mostrar opciones de llamada
  const handleLlamar = () => {
    setShowModal(false);
    setShowCallModal(true);
  };

  // Handler para llamar a Bomberman
  const handleLlamarBomberman = () => {
    setShowCallModal(false);
    window.location.href = "tel:573174319739";
  };

  // Handler para llamar a Gruaman
  const handleLlamarGruaman = () => {
    setShowCallModal(false);
    window.location.href = "tel:3134998161";
  };

  return (
    <>
      <button
        style={{
          position: "fixed",
          right: 14,
          bottom: "80px",
          zIndex: 1000,
          borderRadius: "50%",
          width: 64,
          height: 64,
          background: "#FFD600",
          color: "#fff",
          border: "none",
          fontSize: 24,
          fontWeight: "bold",
          boxShadow: "0 2px 12px #FFD600",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          lineHeight: "1",
        }}
        title="STP"
        onClick={handleSTP}
      >
        <span style={{ fontSize: 24, fontWeight: "bold", letterSpacing: 2 }}>
          <span style={{ color: "#fff" }}>S</span>
          <span style={{ color: "#1976d2" }}>T</span>
          <span style={{ color: "#fff" }}>P</span>
        </span>
      </button>
      {showModal && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.25)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 2px 12px #FFD600",
              padding: "24px 18px",
              minWidth: 220,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignItems: "center"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>¿Qué deseas hacer?</div>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#FFD600", color: "#222", minWidth: 120, fontWeight: 600 }}
              onClick={handleLlamar}
            >
              Llamar
            </button>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#25D366", color: "#fff", minWidth: 120, fontWeight: 600 }}
              onClick={handleWhatsApp}
            >
              Escribir mensaje
            </button>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#eee", color: "#222", minWidth: 120, fontWeight: 600 }}
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {showCallModal && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.25)",
            zIndex: 2100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setShowCallModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 2px 12px #FFD600",
              padding: "24px 18px",
              minWidth: 220,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignItems: "center"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>¿Eres bomberman o gruaman?</div>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#1976d2", color: "#fff", minWidth: 120, fontWeight: 600 }}
              onClick={handleLlamarBomberman}
            >
              Bomberman
            </button>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#c00", color: "#fff", minWidth: 120, fontWeight: 600 }}
              onClick={handleLlamarGruaman}
            >
              Gruaman
            </button>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#eee", color: "#222", minWidth: 120, fontWeight: 600 }}
              onClick={() => setShowCallModal(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {mensaje && (
        <div
          style={{
            position: "fixed",
            right: 14,
            bottom: "150px",
            zIndex: 1100,
            background: "#fff",
            border: "2px solid #FFD600",
            borderRadius: 12,
            padding: "8px 16px",
            boxShadow: "0 2px 8px #FFD600",
            minWidth: 220,
            color: "#1976d2",
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

// Registro del Service Worker para notificaciones push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker registrado', reg);
      })
      .catch(err => {
        console.error('Error registrando Service Worker', err);
      });
  });
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
        <STPButton />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/cedula" element={<CedulaIngreso />} />
            <Route path="/bienvenida" element={<BienvenidaSeleccion usuario={{ nombre: "Invitado", empresa: "GyE" }} />} />
            <Route path="/eleccion/*" element={<Eleccion />} />
            <Route path="/eleccionaic/*" element={<EleccionAIC />} />
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
            <Route path="/hora_ingreso" element={<HoraIngreso />} />
            <Route path="/hora_salida" element={<HoraSalida />} />
            <Route path="/horas_extra_bomberman" element={<HorasExtraBombermanAdmin />} />
            <Route path="/horas_extra_gruaman" element={<HorasExtraGruamanAdmin />} />
          </Routes>
          {/* <Footer /> */}
        </div>
      </div>
    </BrowserRouter>
  </React.StrictMode>
);

// No hay registro manual de service worker aquí, ¡perfecto!

