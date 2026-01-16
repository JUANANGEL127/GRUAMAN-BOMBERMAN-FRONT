import React, { useState, useEffect } from "react";
import axios from "axios";
import { registerWebAuthn, authenticateWebAuthn, WebAuthnError } from "./components/webauthn";
import { subscribeUser } from "./pushNotifications";

// Usa variable de entorno para la base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

// Hook para detectar mobile (max-width: 599px)
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

function CedulaIngreso({ onUsuarioEncontrado }) {
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState("");
  const [gifIndex, setGifIndex] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminShowPass, setAdminShowPass] = useState(false);
  
  // Estado para el modal de registro de nueva llave de acceso
  const [showRegistrarLlaveModal, setShowRegistrarLlaveModal] = useState(false);
  const [registrarLlaveLoading, setRegistrarLlaveLoading] = useState(false);
  const [pendingUsuario, setPendingUsuario] = useState(null);

  const isMobile = useIsMobile(); // <-- ocultar animación en tablet/desktop

  // NO ocultar todo el componente: solo mostraremos el panel principal en mobile.
  // El botón "Ingreso administrador" y su modal deben permanecer siempre visibles.

  useEffect(() => {
    const gifs = ["/gruaman1.1.gif", "/bomberman1.1.gif"];
    const interval = setInterval(() => {
      setGifIndex(prev => (prev + 1) % gifs.length);
    }, 2500); // cambia cada 2.5 segundos
    return () => clearInterval(interval);
  }, []);

  const handleBuscar = async () => {
    setError("");
    if (!cedula) {
      setError("Por favor ingresa tu número de identificación.");
      return;
    }
    try {
      const resp = await axios.get(`${API_BASE_URL}/datos_basicos`);
      const datosArray = Array.isArray(resp.data.datos) ? resp.data.datos : (Array.isArray(resp.data) ? resp.data : []);
      // Solo permitir ingreso si activo === true
      const usuario = datosArray.find(u => {
        const id = u.numero_identificacion || u.cedula || u.id || "";
        return id === cedula && u.activo === true;
      }) || null;

      if (usuario) {
        // Normalizar valores y guardar en localStorage para toda la app
        try {
          const nombre = usuario.nombre || usuario.nombres || usuario.nombre_trabajador || "";
          const numeroId = usuario.numero_identificacion || usuario.cedula || usuario.id || cedula;
          const cargo = usuario.cargo || usuario.cargo_trabajador || usuario.puesto || "";
          const empresaName = usuario.empresa || (usuario.empresa_id === 1 ? "GyE" : (usuario.empresa_id === 2 ? "AIC" : "")) || "";
          const obra = usuario.obra || usuario.nombre_proyecto || usuario.nombre_obra || "";

          localStorage.setItem("nombre_trabajador", nombre);
          localStorage.setItem("usuario", JSON.stringify(usuario));
          localStorage.setItem("cedula_trabajador", numeroId);
          localStorage.setItem("cedula", numeroId);
          if (cargo) localStorage.setItem("cargo_trabajador", cargo);
          if (empresaName) localStorage.setItem("empresa_trabajador", empresaName);
          if (obra) {
            localStorage.setItem("obra", obra);
            localStorage.setItem("nombre_proyecto", obra);
          }
        } catch (e) {
          console.error("Error guardando datos en localStorage:", e);
        }

        // Solicitar permiso de notificaciones push al guardar usuario
        if ("Notification" in window && "serviceWorker" in navigator) {
          try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              const numeroId = usuario.numero_identificacion || usuario.cedula || usuario.id || cedula;
              try {
                await subscribeUser(numeroId);
              } catch (pushErr) {
                setError("No se pudo registrar la suscripción a notificaciones push.");
                console.error("Error al suscribir usuario a notificaciones push:", pushErr);
              }
            }
          } catch (e) {
            console.error("Error solicitando permiso de notificaciones:", e);
          }
        }

        // --- INICIO INTEGRACIÓN WEBAUTHN ---
        // Verificar si el usuario ya tiene credencial biométrica registrada
        let biometriaRegistrada = false;
        try {
          const res = await axios.post(`${API_BASE_URL}/webauthn/hasCredential`, { numero_identificacion: cedula });
          biometriaRegistrada = !!(res.data && res.data.hasCredential);
        } catch (e) {
          // Si el endpoint no existe, se asume que no está registrada
          biometriaRegistrada = false;
        }

        if (!biometriaRegistrada) {
          // Registrar credencial biométrica (solo la primera vez en el dispositivo)
          try {
            await registerWebAuthn({ numero_identificacion: cedula, nombre: usuario.nombre });
          } catch (e) {
            setError("No se pudo registrar la biometría en este dispositivo.");
            return;
          }
        } else {
          // Autenticación biométrica en cada acceso
          try {
            await authenticateWebAuthn({ numero_identificacion: cedula });
          } catch (e) {
            console.log('[CedulaIngreso] Error de autenticación WebAuthn:', e);
            
            // Si el error es por falta de llaves en este dispositivo, ofrecer registrar una nueva
            if (e instanceof WebAuthnError && e.code === 'NO_CREDENTIALS') {
              setPendingUsuario(usuario);
              setShowRegistrarLlaveModal(true);
              return;
            }
            
            setError("No se pudo autenticar la biometría en este dispositivo.");
            return;
          }
        }
        // --- FIN INTEGRACIÓN WEBAUTHN ---

        // Mantener callback existente
        onUsuarioEncontrado && onUsuarioEncontrado({
          nombre: usuario.nombre,
          empresa: usuario.empresa_id === 1 ? "GyE" : "AIC",
          numero_identificacion: usuario.numero_identificacion
        });
      } else {
        setError("No haces parte de nuestros super héroes o tu usuario está inactivo.");
      }
    } catch (err) {
      console.error("Error obteniendo datos básicos:", err);
      setError("No haces parte de nuestros super héroes.");
    }
  };

  const handleAdminLogin = async () => {
    setAdminError("");
    setAdminLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPass }),
      });
      const data = await response.json();
      if (data.success) {
        setAdminError("");
        setShowAdminModal(false);
        localStorage.setItem("admin_rol", data.rol);
        // Redireccionar según el rol usando las rutas correctas
        if (data.rol === "gruaman") {
          window.location.href = "/administrador";
        } else if (data.rol === "bomberman") {
          window.location.href = "/administrador_bomberman";
        } else {
          setAdminError("Rol no reconocido.");
        }
      } else {
        setAdminError(data.error || "Contraseña incorrecta.");
      }
    } catch (err) {
      setAdminError("Error de conexión.");
    } finally {
      setAdminLoading(false);
    }
  };

  // Función para registrar nueva llave de acceso en este dispositivo
  const handleRegistrarNuevaLlave = async () => {
    if (!pendingUsuario) return;
    
    setRegistrarLlaveLoading(true);
    setError("");
    
    try {
      const numeroId = pendingUsuario.numero_identificacion || pendingUsuario.cedula || pendingUsuario.id || cedula;
      const nombre = pendingUsuario.nombre || pendingUsuario.nombres || pendingUsuario.nombre_trabajador || "";
      
      await registerWebAuthn({ numero_identificacion: numeroId, nombre });
      
      // Registro exitoso, cerrar modal y continuar con el flujo
      setShowRegistrarLlaveModal(false);
      
      // Continuar con el callback original
      onUsuarioEncontrado && onUsuarioEncontrado({
        nombre: pendingUsuario.nombre,
        empresa: pendingUsuario.empresa_id === 1 ? "GyE" : "AIC",
        numero_identificacion: pendingUsuario.numero_identificacion
      });
      
      setPendingUsuario(null);
    } catch (e) {
      console.error('[CedulaIngreso] Error registrando nueva llave:', e);
      setError("No se pudo registrar la nueva llave de acceso en este dispositivo.");
      setShowRegistrarLlaveModal(false);
      setPendingUsuario(null);
    } finally {
      setRegistrarLlaveLoading(false);
    }
  };

  const handleCancelarRegistroLlave = () => {
    setShowRegistrarLlaveModal(false);
    setPendingUsuario(null);
    setError("Debes registrar una llave de acceso para continuar.");
  };

  return (
    <div className="form-container" style={{ position: "relative", minHeight: "100vh" }}>
      {/* Panel principal: solo visible en mobile */}
      {isMobile && (
        <div
          className="card-section"
          style={{
            background: "rgba(255,255,255,0.22)",
            borderRadius: "18px",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.28)",
            padding: "32px 24px",
            maxWidth: 400,
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
          }}
        >
          <h2 className="card-title">Ingresa tu cédula para iniciar tu aventura</h2>
          <input
            className="input"
            type="text"
            value={cedula}
            onChange={e => setCedula(e.target.value)}
            placeholder="Número de identificación"
          />
          <button className="button" onClick={handleBuscar} style={{ marginTop: 16 }}>
            Continuar
          </button>
          {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
        </div>
      )}

      {/* Botón de ingreso administrador en la misma posición que Instalar App */}
      <button
        className="button"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 24,
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "12px 20px",
          boxShadow: "0 2px 8px rgba(25,118,210,0.10)",
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: 0.5,
          cursor: "pointer"
        }}
        onClick={() => {
          setShowAdminModal(true);
          setAdminPass("");
          setAdminError("");
        }}
      >
        Ingreso administrador
      </button>
      {/* Modal de administrador con efecto liquid glass */}
      {showAdminModal && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(31,38,135,0.13)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.22)",
              borderRadius: 18,
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1.5px solid rgba(255,255,255,0.28)",
              padding: "32px 24px",
              minWidth: 300,
              textAlign: "center",
              position: "relative",
              fontFamily: "inherit"
            }}
          >
            <h3 style={{ marginBottom: 18, color: "#1976d2", fontWeight: 700, letterSpacing: 1 }}>
              Bienvenido administrador
            </h3>
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 320,
                margin: "0 auto 14px auto",
                display: "flex",
                alignItems: "center",
                background: "#f7faff",
                borderRadius: 8,
                border: "1.5px solid #1976d2",
                boxShadow: "0 2px 8px rgba(25,118,210,0.07)",
                transition: "box-shadow 0.2s",
              }}
            >
              <input
                type={adminShowPass ? "text" : "password"}
                placeholder="Contraseña"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                style={{
                  flex: 1,
                  padding: "12px 44px 12px 14px",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 16,
                  background: "transparent",
                  color: "#222",
                  fontFamily: "inherit",
                  outline: "none",
                  minWidth: 0,
                }}
                onKeyDown={e => { if (e.key === "Enter") handleAdminLogin(); }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setAdminShowPass(v => !v)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  margin: 0,
                  outline: "none",
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  height: 32,
                  width: 32,
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "background 0.15s",
                }}
                aria-label={adminShowPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                onMouseDown={e => e.preventDefault()}
              >
                {adminShowPass ? (
                  // Ojo abierto SVG
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="12" rx="7" ry="5" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                ) : (
                  // Ojo cerrado SVG
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.21-2.61 3.36-4.77 6-6.11" />
                    <path d="M1 1l22 22" />
                  </svg>
                )}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                className="button"
                onClick={handleAdminLogin}
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 22px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(25,118,210,0.13)",
                  letterSpacing: 0.5
                }}
                disabled={adminLoading}
              >
                {adminLoading ? "Ingresando..." : "Ingresar"}
              </button>
              <button
                className="button"
                onClick={() => setShowAdminModal(false)}
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(25,118,210,0.07)",
                  letterSpacing: 0.5
                }}
                disabled={adminLoading}
              >
                Cancelar
              </button>
            </div>
            {adminError && <div style={{ color: "#c00", marginTop: 14, fontWeight: 500 }}>{adminError}</div>}
          </div>
        </div>
      )}
      
      {/* Modal para registrar nueva llave de acceso */}
      {showRegistrarLlaveModal && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(31,38,135,0.18)",
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.28)",
              borderRadius: 18,
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1.5px solid rgba(255,255,255,0.35)",
              padding: "32px 24px",
              minWidth: 300,
              maxWidth: 360,
              textAlign: "center",
              position: "relative",
              fontFamily: "inherit"
            }}
          >
            {/* Icono de llave/huella */}
            <div style={{ marginBottom: 16 }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
                <path d="M12 11c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" />
                <path d="M19 11h-4" />
                <path d="M15 7v8" />
                <path d="M12 11h-3" />
                <circle cx="9" cy="11" r="6" />
              </svg>
            </div>
            
            <h3 style={{ marginBottom: 14, color: "#1976d2", fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>
              Registrar llave de acceso
            </h3>
            
            <p style={{ color: "#333", fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
              No hay llaves de acceso disponibles en este dispositivo.
            </p>
            
            <p style={{ color: "#555", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              ¿Deseas registrar una nueva llave de acceso (huella dactilar o Face ID) para iniciar sesión desde este dispositivo?
            </p>
            
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                className="button"
                onClick={handleRegistrarNuevaLlave}
                disabled={registrarLlaveLoading}
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: registrarLlaveLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(25,118,210,0.18)",
                  letterSpacing: 0.5,
                  opacity: registrarLlaveLoading ? 0.7 : 1
                }}
              >
                {registrarLlaveLoading ? "Registrando..." : "Sí, registrar"}
              </button>
              <button
                className="button"
                onClick={handleCancelarRegistroLlave}
                disabled={registrarLlaveLoading}
                style={{
                  background: "#f5f5f5",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: registrarLlaveLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  letterSpacing: 0.5
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mostrar la animación solo en mobile */}
      {isMobile && (
        <img
          src={gifIndex === 0 ? "/gruaman1.1.gif" : "/bomberman1.1.gif"}
          alt={gifIndex === 0 ? "GruaMan animado" : "BomberMan animado"}
          style={{
            position: "absolute",
            top: "30%",
            left: 0,
            width: "95vw",
            height: "60vh",
            objectFit: "cover",
            zIndex: 1,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      )}
    </div>
  );
}

export default CedulaIngreso;
