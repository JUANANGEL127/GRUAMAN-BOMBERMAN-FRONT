/* eslint-disable react-refresh/only-export-components */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Eleccion from "./components/gruaman/eleccion";
import EleccionAIC from "./components/bomberman/eleccionaic";
import PlanillaBombeo from "./components/bomberman/planillabombeo";
import Checklist from "./components/bomberman/checklist";
import InventarioObra from "./components/bomberman/inventariosobra";
import HerramientasMantenimiento from "./components/bomberman/herramientas_mantenimiento";
import KitLimpieza from "./components/bomberman/kit_limpieza";
import Administrador from "./components/administrador_gruaman/administrador";
import PermisoTrabajo from "./components/compartido/permiso_trabajo";
import ChequeoAlturas from "./components/compartido/chequeo_alturas";
import ChequeoTorreGruas from "./components/gruaman/chequeo_torregruas";
import InspeccionEPCC from "./components/gruaman/inspeccion_epcc";
import InspeccionIzaje from "./components/gruaman/inspeccion_izaje";
import InspeccionEPCCBomberman from "./components/bomberman/inspeccion_epcc_bomberman";
import ChequeoElevador from "./components/gruaman/chequeo_elevador";
import CedulaIngreso from "./CedulaIngreso";
import BienvenidaSeleccion from "./BienvenidaSeleccion";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./index.css";
import PermisoTrabajoAdmin from "./components/administrador_gruaman/permiso_trabajo_admin";
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
import HerramientasMantenimientoAdmin from "./components/administrador_bomberman/herramientas_mantenimiento_admin";
import KitLimpiezaAdmin from "./components/administrador_bomberman/kit_limpieza_admin";
import AdminUsuarios from "./components/administrador_gruaman/admin_usuarios";
import AdminUsuariosBomberman from "./components/administrador_bomberman/admin_usuarios_bomberman";
import AdminsObras from "./components/administrador_gruaman/admins_obras";
import AdminObrasBomberman from "./components/administrador_bomberman/admin_obras_bomberman";
import HoraIngreso from "./components/compartido/horada_ingreso";
import HoraSalida from "./components/compartido/hora_salida";
import HorasExtraBombermanAdmin from "./components/administrador_bomberman/horas_extra_bomberman";
import HorasExtraGruamanAdmin from "./components/administrador_gruaman/horas_extra_gruaman";
import EleccionLideres from "./components/Lideres_bombas/eleccion_lideres";
import EleccionSST from './components/sst/eleccion_sst';
import EleccionTecnicos from './components/tecnicos/eleccion_tecnicos';
import PQR from './components/sst/pqr';
import Hallazgos from './components/sst/hallazgos';
import GameFlow     from './components/game/GameFlow';
import LevelWrapper from './components/game/LevelWrapper';
import AtsSelector           from './components/gruaman/AtsSelector';
import AtsOperacionTorregrua from './components/gruaman/ats/AtsOperacionTorregrua';
import AtsMandoInalam        from './components/gruaman/ats/AtsMandoInalam';
import AtsMontajeTorregrua   from './components/gruaman/ats/AtsMontajeTorregrua';
import AtsMontajeElevador    from './components/gruaman/ats/AtsMontajeElevador';
import AtsDesmontajeTorregrua from './components/gruaman/ats/AtsDesmontajeTorregrua';
import AtsTelescopaje        from './components/gruaman/ats/AtsTelescopaje';
import AtsMantenimiento      from './components/gruaman/ats/AtsMantenimiento';
import AtsElevador           from './components/gruaman/ats/AtsElevador';
import { getSessionHomePath, isAuthenticatedAuthSession } from "./features/auth/adapters/authSessionAdapter";
import { AuthProvider } from "./features/auth/context/AuthProvider";
import ForbiddenPage from "./features/auth/pages/ForbiddenPage";
import { useAuth } from "./features/auth/hooks/useAuth";
import ProtectedRoute from "./features/auth/routes/ProtectedRoute";
import RoleGuard from "./features/auth/routes/RoleGuard";
import { readReturnTo } from "./features/auth/utils/returnTo";
import { IndicadorCentralAdminPage } from "./features/indicador-central";

function resolveAdminLanding(session) {
  const pendingReturnTo = readReturnTo();

  if (
    pendingReturnTo &&
    (pendingReturnTo.startsWith("/administrador") ||
      pendingReturnTo.startsWith("/indicador-central-admin"))
  ) {
    return pendingReturnTo;
  }

  return getSessionHomePath(session);
}



/**
 * Se suscribe a cambios en el ancho del viewport y retorna true cuando
 * este es menor a 600 px (punto de quiebre para móviles).
 *
 * @returns {boolean}
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 600 : true
  );
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 599px)");
    const onChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return isMobile;
}

/**
 * Hook de arrastre para botones flotantes.
 * Persiste la posición en localStorage. Distingue tap de drag (umbral 5px).
 * @param {string} storageKey - clave para localStorage
 * @param {() => {x: number, y: number}} defaultPos - función que retorna posición por defecto
 */
function useDraggable(defaultPos) {
  const [pos, setPos] = React.useState(() => defaultPos());

  const posRef = React.useRef(pos);
  React.useEffect(() => { posRef.current = pos; }, [pos]);

  const dragging = React.useRef(false);
  const startPtr = React.useRef({ x: 0, y: 0 });
  const startPos = React.useRef({ x: 0, y: 0 });
  const wasDragged = React.useRef(false);

  const onPointerDown = React.useCallback((e) => {
    dragging.current = true;
    wasDragged.current = false;
    startPtr.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...posRef.current };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = React.useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - startPtr.current.x;
    const dy = e.clientY - startPtr.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) wasDragged.current = true;
    if (!wasDragged.current) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 64, startPos.current.x + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 64, startPos.current.y + dy));
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = React.useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    // posición no persiste — vuelve al default al reabrir la app
  }, []);

  const onClickCapture = React.useCallback((e) => {
    if (wasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
      wasDragged.current = false;
    }
  }, []);

  return { pos, onPointerDown, onPointerMove, onPointerUp, onClickCapture };
}

/**
 * Botón flotante de emergencia visible únicamente en móvil.
 *
 * Presenta un modal con opciones de llamada y WhatsApp. La opción de WhatsApp
 * enruta al usuario según su rol (Bomberman / Gruaman) y, para Bomberman,
 * permite seleccionar el grupo regional. Copia un mensaje SOS preformateado
 * al portapapeles antes de abrir la URL del grupo de WhatsApp.
 */
function SOSButton() {
  const isMobile = useIsMobile();
    const [mensaje, setMensaje] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);
  const [showRegionModal, setShowRegionModal] = React.useState(false);
  const [showRoleModal, setShowRoleModal] = React.useState(false);
  const { pos: sosPos, onPointerDown: sosDown, onPointerMove: sosMove, onPointerUp: sosUp, onClickCapture: sosClickCapture } =
    useDraggable(() => ({ x: 14, y: window.innerHeight - 144 }));

  if (!isMobile) return null;

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

  const handleSOS = () => {
    setShowModal(true);
    setMensaje("");
  };

  const handleLlamar = () => {
    setShowModal(false);
    window.location.href = "tel:573183485318";
  };

  const handleWhatsApp = () => {
    setShowModal(false);
    setShowRoleModal(true);
    setMensaje("");
  };

  const handleRole = (role) => {
    setShowRoleModal(false);
    if (role === "bomberman") {
      setShowRegionModal(true);
      return;
    }
    if (role === "gruaman") {
      handleRegion('https://chat.whatsapp.com/F9SaM1zAVuw5EoS7SKQ6rK?mode=gi_c');
    }
  };

  /**
   * Copia el mensaje de incidente al portapapeles y abre la URL del grupo
   * regional de WhatsApp.
   * @param {string} regionUrl - Enlace profundo al grupo de WhatsApp de destino.
   */
  const handleRegion = (regionUrl) => {
    setShowRegionModal(false);
    const { usuario, obra } = getUsuarioObra();
    const mensajeRegion = `Soy ${usuario || "un usuario"} en la obra ${obra || "desconocida"}, tuve un accidente o incidente`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mensajeRegion);
      setTimeout(() => {
        window.location.href = regionUrl;
      }, 300);
      setMensaje("Mensaje copiado. Pega el mensaje en el grupo de WhatsApp.");
    } else {
      window.location.href = regionUrl;
      setMensaje("Copia y pega este mensaje en el grupo: " + mensajeRegion);
    }
    setTimeout(() => setMensaje(""), 3000);
  };

  return (
    <>
      <button
        style={{
          position: "fixed",
          left: sosPos.x,
          top: sosPos.y,
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
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={sosDown}
        onPointerMove={sosMove}
        onPointerUp={sosUp}
        onClickCapture={sosClickCapture}
        onClick={handleSOS}
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
    {showRegionModal && (
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.25)",
          zIndex: 2050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        onClick={() => setShowRegionModal(false)}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 2px 12px #c00",
            padding: "18px",
            minWidth: 260,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center"
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontWeight: 600, fontSize: 16 }}>Elige la región</div>
          <button
            className="permiso-trabajo-btn"
            style={{ background: "#1976d2", color: "#fff", minWidth: 160, fontWeight: 600 }}
            onClick={() => handleRegion('https://chat.whatsapp.com/J3GqgX5SvOUAnPp30mB1ab?mode=gi_c')}
          >
            Cundinamarca
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ background: "#1976d2", color: "#fff", minWidth: 160, fontWeight: 600 }}
            onClick={() => handleRegion('https://chat.whatsapp.com/EDHaafxQQtcIDsxrm0plMR?mode=gi_c')}
          >
            Antioquia
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ background: "#1976d2", color: "#fff", minWidth: 160, fontWeight: 600 }}
            onClick={() => handleRegion('https://chat.whatsapp.com/DkkCKXpMxPj751BoltbLBq?mode=gi_c')}
          >
            Atlantico
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ background: "#eee", color: "#222", minWidth: 120, fontWeight: 600 }}
            onClick={() => setShowRegionModal(false)}
          >
            Cancelar
          </button>
        </div>
      </div>
    )}
    {showRoleModal && (
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.25)",
          zIndex: 2040,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        onClick={() => setShowRoleModal(false)}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 2px 12px #c00",
            padding: "18px",
            minWidth: 260,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center"
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontWeight: 600, fontSize: 16 }}>¿Eres bomberman o gruaman?</div>
          <button
            className="permiso-trabajo-btn"
            style={{ background: "#1976d2", color: "#fff", minWidth: 160, fontWeight: 600 }}
            onClick={() => handleRole('bomberman')}
          >
            Bomberman
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ background: "#c00", color: "#fff", minWidth: 160, fontWeight: 600 }}
            onClick={() => handleRole('gruaman')}
          >
            Gruaman
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ background: "#eee", color: "#222", minWidth: 120, fontWeight: 600 }}
            onClick={() => setShowRoleModal(false)}
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

/**
 * Botón flotante de paro de obra (STP) visible únicamente en móvil.
 *
 * Replica el patrón de SOSButton pero para paros no críticos. Ofrece llamada
 * (con sub-selección Bomberman / Gruaman) y reporte por WhatsApp con
 * enrutamiento por rol y región. Copia un mensaje STP preformateado al
 * portapapeles antes de abrir la URL del grupo.
 */
function STPButton() {
  const isMobile = useIsMobile();
  const [showModal, setShowModal] = React.useState(false);
  const [showCallModal, setShowCallModal] = React.useState(false);
  const [mensaje, setMensaje] = React.useState("");
  const [showRegionModalSTP, setShowRegionModalSTP] = React.useState(false);
  const [showRoleModalSTP, setShowRoleModalSTP] = React.useState(false);
  const { pos: stpPos, onPointerDown: stpDown, onPointerMove: stpMove, onPointerUp: stpUp, onClickCapture: stpClickCapture } =
    useDraggable(() => ({ x: window.innerWidth - 78, y: window.innerHeight - 144 }));

  if (!isMobile) return null;

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

  const handleSTP = () => {
    setShowModal(true);
    setMensaje("");
  };

  const handleWhatsApp = () => {
    setShowModal(false);
    setShowRoleModalSTP(true);
    setMensaje("");
  };

  const handleRoleSTP = (role) => {
    setShowRoleModalSTP(false);
    if (role === "bomberman") {
      setShowRegionModalSTP(true);
      return;
    }
    if (role === "gruaman") {
      handleRegionSTP('https://chat.whatsapp.com/F9SaM1zAVuw5EoS7SKQ6rK?mode=gi_c');
    }
  };

  /**
   * Copia el mensaje de paro de obra al portapapeles y abre la URL del grupo
   * regional de WhatsApp.
   * @param {string} regionUrl - Enlace profundo al grupo de WhatsApp de destino.
   */
  const handleRegionSTP = (regionUrl) => {
    setShowRegionModalSTP(false);
    const { usuario, obra } = getUsuarioObra();
    const mensajeRegion = `Soy ${usuario || "un usuario"} en la obra ${obra || "desconocida"}, tuve un paro en obra, necesito asistencia`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mensajeRegion);
      setTimeout(() => {
        window.location.href = regionUrl;
      }, 300);
      setMensaje("Mensaje copiado. Pega el mensaje en el grupo de WhatsApp.");
    } else {
      window.location.href = regionUrl;
      setMensaje("Copia y pega este mensaje en el grupo: " + mensajeRegion);
    }
    setTimeout(() => setMensaje(""), 3000);
  };

  const handleLlamar = () => {
    setShowModal(false);
    setShowCallModal(true);
  };

  const handleLlamarBomberman = () => {
    setShowCallModal(false);
    window.location.href = "tel:573174319739";
  };

  const handleLlamarGruaman = () => {
    setShowCallModal(false);
    window.location.href = "tel:3134998161";
  };

  return (
    <>
      <button
        style={{
          position: "fixed",
          left: stpPos.x,
          top: stpPos.y,
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
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={stpDown}
        onPointerMove={stpMove}
        onPointerUp={stpUp}
        onClickCapture={stpClickCapture}
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
      {showRegionModalSTP && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.25)",
            zIndex: 2050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setShowRegionModalSTP(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 2px 12px #FFD600",
              padding: "18px",
              minWidth: 260,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "center"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, fontSize: 16 }}>Elige la región</div>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#1976d2", color: "#fff", minWidth: 160, fontWeight: 600 }}
              onClick={() => handleRegionSTP('https://chat.whatsapp.com/J3GqgX5SvOUAnPp30mB1ab?mode=gi_c')}
            >
              Cundinamarca
            </button>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#1976d2", color: "#fff", minWidth: 160, fontWeight: 600 }}
              onClick={() => handleRegionSTP('https://chat.whatsapp.com/EDHaafxQQtcIDsxrm0plMR?mode=gi_c')}
            >
              Antioquia
            </button>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#1976d2", color: "#fff", minWidth: 160, fontWeight: 600 }}
              onClick={() => handleRegionSTP('https://chat.whatsapp.com/DkkCKXpMxPj751BoltbLBq?mode=gi_c')}
            >
              Atlantico
            </button>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#eee", color: "#222", minWidth: 120, fontWeight: 600 }}
              onClick={() => setShowRegionModalSTP(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {showRoleModalSTP && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.25)",
            zIndex: 2040,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setShowRoleModalSTP(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 2px 12px #FFD600",
              padding: "18px",
              minWidth: 260,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              alignItems: "center"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, fontSize: 16 }}>¿Eres bomberman o gruaman?</div>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#1976d2", color: "#fff", minWidth: 160, fontWeight: 600 }}
              onClick={() => handleRoleSTP('bomberman')}
            >
              Bomberman
            </button>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#c00", color: "#fff", minWidth: 160, fontWeight: 600 }}
              onClick={() => handleRoleSTP('gruaman')}
            >
              Gruaman
            </button>
            <button
              className="permiso-trabajo-btn"
              style={{ background: "#eee", color: "#222", minWidth: 120, fontWeight: 600 }}
              onClick={() => setShowRoleModalSTP(false)}
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

const workerRoutes = [
  { path: "bienvenida", element: <BienvenidaSeleccion /> },
  { path: "game/rotate-screen", element: <GameFlow key="rotate" step="rotate" /> },
  { path: "game/story-intro", element: <GameFlow key="story" step="story" /> },
  { path: "game/world-map", element: <GameFlow key="map" step="map" /> },
  { path: "game/level/:worldId", element: <LevelWrapper /> },
  { path: "ats-selector", element: <AtsSelector /> },
  { path: "ats/operacion-torregrua", element: <AtsOperacionTorregrua /> },
  { path: "ats/mando-inalam", element: <AtsMandoInalam /> },
  { path: "ats/montaje-torregrua", element: <AtsMontajeTorregrua /> },
  { path: "ats/montaje-elevador", element: <AtsMontajeElevador /> },
  { path: "ats/desmontaje-torregrua", element: <AtsDesmontajeTorregrua /> },
  { path: "ats/telescopaje", element: <AtsTelescopaje /> },
  { path: "ats/mantenimiento", element: <AtsMantenimiento /> },
  { path: "ats/elevador", element: <AtsElevador /> },
  { path: "eleccion/*", element: <Eleccion /> },
  { path: "eleccionaic/*", element: <EleccionAIC /> },
  { path: "planillabombeo", element: <PlanillaBombeo /> },
  { path: "checklist", element: <Checklist /> },
  { path: "inventariosobra/*", element: <InventarioObra /> },
  { path: "herramientas_mantenimiento", element: <HerramientasMantenimiento /> },
  { path: "kit_limpieza", element: <KitLimpieza /> },
  { path: "permiso_trabajo", element: <PermisoTrabajo /> },
  { path: "chequeo_alturas", element: <ChequeoAlturas /> },
  { path: "chequeo_torregruas", element: <ChequeoTorreGruas /> },
  { path: "chequeo_elevador", element: <ChequeoElevador /> },
  { path: "inspeccion_epcc", element: <InspeccionEPCC /> },
  { path: "inspeccion_izaje", element: <InspeccionIzaje /> },
  { path: "inspeccion_epcc_bomberman", element: <InspeccionEPCCBomberman /> },
  { path: "hora_ingreso", element: <HoraIngreso /> },
  { path: "hora_salida", element: <HoraSalida /> },
  { path: "eleccion_lideres/*", element: <EleccionLideres /> },
  { path: "eleccion_sst/*", element: <EleccionSST /> },
  { path: "eleccion_tecnicos/*", element: <EleccionTecnicos /> },
  { path: "pqr", element: <PQR /> },
  { path: "hallazgos", element: <Hallazgos /> },
];

const gruamanAdminRoutes = [
  { path: "administrador", element: <Administrador /> },
  { path: "permiso_trabajo_admin", element: <PermisoTrabajoAdmin /> },
  { path: "chequeo_alturas_admin", element: <ChequeoAlturasAdmin /> },
  { path: "chequeo_torregruas_admin", element: <ChequeoTorreGruasAdmin /> },
  { path: "chequeo_elevador_admin", element: <ChequeoElevadorAdmin /> },
  { path: "inspeccion_EPCC_admins", element: <InspeccionEPCCAdmins /> },
  { path: "inspeccion_izaje_admin", element: <InspeccionIzajeAdmin /> },
  { path: "admin_usuarios", element: <AdminUsuarios /> },
  { path: "admins_obras", element: <AdminsObras /> },
  { path: "horas_extra_gruaman", element: <HorasExtraGruamanAdmin /> },
];

const bombermanAdminRoutes = [
  { path: "administrador_bomberman", element: <AdministradorBomberman /> },
  { path: "planilla_bombeo_admin", element: <PlanillaBombeoAdmin /> },
  { path: "inventarios_obra_admin", element: <InventariosObraAdmin /> },
  { path: "checklist_admin", element: <ChecklistAdmin /> },
  { path: "inspeccion_epcc_bomberman_admin", element: <InspeccionEPCCBombermanAdmin /> },
  { path: "herramientas_mantenimiento_admin", element: <HerramientasMantenimientoAdmin /> },
  { path: "kit_limpieza_admin", element: <KitLimpiezaAdmin /> },
  { path: "admin_usuarios_bomberman", element: <AdminUsuariosBomberman /> },
  { path: "admin_obras_bomberman", element: <AdminObrasBomberman /> },
  { path: "horas_extra_bomberman", element: <HorasExtraBombermanAdmin /> },
];

function CedulaLoginBridge() {
  const navigate = useNavigate();
  const { isAuthenticated, isReady, session, signIn } = useAuth();
  const [bridgeError, setBridgeError] = React.useState("");

  const resolveSessionLanding = React.useCallback((authSession) => {
    if (authSession?.kind === "admin") {
      return resolveAdminLanding(authSession);
    }

    return getSessionHomePath(authSession);
  }, []);

  React.useEffect(() => {
    if (!isReady || !isAuthenticated || !session) return;
    navigate(resolveSessionLanding(session), { replace: true });
  }, [isAuthenticated, isReady, navigate, resolveSessionLanding, session]);

  const handleUsuarioAutenticado = React.useCallback(async () => {
    try {
      const refreshedSession = await signIn({ source: "cedula-login-bridge" });

      if (isAuthenticatedAuthSession(refreshedSession)) {
        setBridgeError("");
        navigate(resolveSessionLanding(refreshedSession), { replace: true });
        return;
      }
    } catch {
      // The inline message below is the user-facing fallback.
    }

    setBridgeError(
      "La autenticación local terminó, pero no pudimos rehidratar la sesión segura desde /auth/session."
    );
  }, [navigate, resolveSessionLanding, signIn]);

  return (
    <>
      <CedulaIngreso onUsuarioEncontrado={handleUsuarioAutenticado} />
      {bridgeError ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <div
            style={{
              maxWidth: 420,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid #dc2626",
              color: "#991b1b",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {bridgeError}
          </div>
        </div>
      ) : null}
    </>
  );
}

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        registration.update();
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener("statechange", () => {});
        });
      })
      .catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
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
          <div className="global-clouds" aria-hidden="true">
            <span className="global-cloud global-cloud--1">☁</span>
            <span className="global-cloud global-cloud--2">☁</span>
            <span className="global-cloud global-cloud--3">☁</span>
            <span className="global-cloud global-cloud--4">☁</span>
          </div>
          <SOSButton />
          <STPButton />
          <div style={{ position: "relative", zIndex: 1 }}>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/cedula" element={<CedulaLoginBridge />} />
              <Route path="/acceso-denegado" element={<ForbiddenPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<RoleGuard allowedKinds={["worker"]} />}>
                  {workerRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                </Route>

                <Route element={<RoleGuard allowedKinds={["admin"]} allowedAdminRoles={["gruaman"]} />}>
                  {gruamanAdminRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                </Route>

                <Route element={<RoleGuard allowedKinds={["admin"]} allowedAdminRoles={["bomberman"]} />}>
                  {bombermanAdminRoutes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                </Route>

                <Route
                  element={<RoleGuard allowedKinds={["admin"]} allowedAdminRoles={["gruaman", "bomberman"]} />}
                >
                  <Route path="indicador-central-admin" element={<IndicadorCentralAdminPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {/* <Footer /> */}
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
