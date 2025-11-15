import React, { useState, useEffect } from "react";
import axios from "axios";

// Usa variable de entorno para la base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

function CedulaIngreso({ onUsuarioEncontrado }) {
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState("");
  const [gifIndex, setGifIndex] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

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

  return (
    <div className="form-container" style={{ position: "relative", minHeight: "100vh" }}>
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
            <input
              type="password"
              placeholder="Contraseña"
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1.5px solid #1976d2",
                width: "90%",
                marginBottom: 14,
                fontSize: 16,
                outline: "none",
                background: "#f7faff",
                color: "#222",
                fontFamily: "inherit"
              }}
              onKeyDown={e => { if (e.key === "Enter") handleAdminLogin(); }}
              autoFocus
            />
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
    </div>
  );
}

export default CedulaIngreso;
