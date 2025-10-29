import React, { useState, useEffect } from "react";
import axios from "axios";

function CedulaIngreso({ onUsuarioEncontrado }) {
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState("");
  const [gifIndex, setGifIndex] = useState(0);

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
      const resp = await axios.get(`http://localhost:3000/datos_basicos`);
      const datosArray = Array.isArray(resp.data.datos) ? resp.data.datos : (Array.isArray(resp.data) ? resp.data : []);
      const usuario = datosArray.find(u => {
        // Normalizar posible campo de identificación
        const id = u.numero_identificacion || u.cedula || u.id || "";
        return id === cedula;
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
        setError("No haces parte de nuestros super héroes.");
      }
    } catch (err) {
      console.error("Error obteniendo datos básicos:", err);
      setError("No haces parte de nuestros super héroes.");
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
