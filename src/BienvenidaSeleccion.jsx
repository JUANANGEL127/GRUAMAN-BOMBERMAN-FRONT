import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Usa variable de entorno para la base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

function BienvenidaSeleccion({ usuario }) {
  const [obra_busqueda, setObraBusqueda] = useState("");
  const [lista_obras, setListaObras] = useState([]);
  const [obra_id_seleccionada, setObraIdSeleccionada] = useState("");
  const [ubicacion, setUbicacion] = useState({ lat: null, lon: null });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_BASE_URL}/obras`)
      .then(res => {
        // Solo mostrar obras con activa === true
        const obrasActivas = (res.data.obras || []).filter(o => o.activa === true);
        setListaObras(obrasActivas);
      })
      .catch(() => setListaObras([]));
  }, []);

  // Guardar usuario recibido en localStorage para que esté disponible en toda la app
  useEffect(() => {
    if (!usuario) return;
    try {
      localStorage.setItem("usuario", JSON.stringify(usuario));
      if (usuario.nombre) localStorage.setItem("nombre_trabajador", usuario.nombre);
      if (usuario.numero_identificacion) localStorage.setItem("cedula_trabajador", usuario.numero_identificacion);
      if (usuario.empresa) localStorage.setItem("empresa_trabajador", usuario.empresa);
    } catch (e) {
      console.error("Error guardando usuario en localStorage", e);
    }
  }, [usuario]);

  const handleObraChange = e => {
    const nombre_obra = e.target.value;
    setObraBusqueda(nombre_obra);
    const obra_obj = lista_obras.find(o => o.nombre_obra === nombre_obra);
    if (obra_obj) {
      setObraIdSeleccionada(obra_obj.id);
      // Guardar obra seleccionada en localStorage (nombre, id, constructora, nombre_proyecto)
      try {
        localStorage.setItem("obra", obra_obj.nombre_obra || "");
        localStorage.setItem("obra_id", String(obra_obj.id || ""));
        if (obra_obj.constructora) localStorage.setItem("constructora", obra_obj.constructora);
        if (obra_obj.nombre_obra) localStorage.setItem("nombre_proyecto", obra_obj.nombre_obra);
      } catch (err) {
        console.error("Error guardando obra en localStorage", err);
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => setUbicacion({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => setUbicacion({ lat: null, lon: null })
        );
      }
    } else {
      setObraIdSeleccionada("");
      setUbicacion({ lat: null, lon: null });
      try {
        localStorage.removeItem("obra");
        localStorage.removeItem("obra_id");
        localStorage.removeItem("constructora");
        localStorage.removeItem("nombre_proyecto");
      } catch (err) {
        console.error("Error limpiando obra en localStorage", err);
      }
    }
  };

  const handleEmpezar = async () => {
    setError("");
    if (!obra_id_seleccionada || ubicacion.lat === null || ubicacion.lon === null) {
      setError("Selecciona una catedral y activa la ubicación.");
      return;
    }
    try {
      const resp = await axios.post(`${API_BASE_URL}/validar_ubicacion`, {
        obra_id: obra_id_seleccionada,
        lat: ubicacion.lat,
        lon: ubicacion.lon
      });
      if (resp.data && resp.data.ok) {
        // Asegurar que la obra seleccionada esté persistida antes de navegar
        const obra_obj = lista_obras.find(o => o.id === obra_id_seleccionada);
        if (obra_obj) {
          try {
            localStorage.setItem("obra", obra_obj.nombre_obra || "");
            localStorage.setItem("obra_id", String(obra_obj.id || ""));
            if (obra_obj.constructora) localStorage.setItem("constructora", obra_obj.constructora);
            if (obra_obj.nombre_obra) localStorage.setItem("nombre_proyecto", obra_obj.nombre_obra);
          } catch (err) {
            console.error("Error guardando obra en localStorage antes de navegar", err);
          }
        }
        if (usuario.empresa === "GyE") {
          navigate("/eleccion");
        } else {
          navigate("/eleccionaic");
        }
      } else {
        setError("No se encuentra en la ubicación seleccionada.");
      }
    } catch {
      setError("No se encuentra en la ubicación seleccionada.");
    }
  };

  return (
    <div className="form-container">
      {/* Bocadillo fuera de la card, usando la imagen texto1.png */}
      <div
        style={{
          position: "fixed",
          top: "30vh",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          width: "420px",
          height: "180px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <img
          src="/texto1.png"
          alt="comic bubble"
          style={{
            position: "absolute",
            width: "100%",
            height: "150%",
            objectFit: "contain",
            filter: "drop-shadow(0 8px 32px rgba(31,38,135,0.18))",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "38%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
            width: "80%",
            textAlign: "center",
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "#000",
            userSelect: "none",
            lineHeight: "1.2",
            pointerEvents: "none",
            fontFamily: "'sans-serif",
            letterSpacing: "1px"
          }}
        >
          <div>Bienvenido</div>
          <div style={{ marginTop: "4px" }}>Super héroe</div>
          <div style={{ marginTop: "4px", fontWeight: 600, fontSize: "1.25rem" }}>
            {usuario.nombre}
          </div>
        </div>
      </div>
      <div className="card-section" style={{ alignItems: "center", textAlign: "center" }}>
        <h2 className="card-title" style={{ marginBottom: 18 }}>Selecciona la catedral que deseas construir hoy</h2>
        <input
          className="input"
          list="lista-obras"
          placeholder="Buscar o selecciona la obra"
          value={obra_busqueda}
          onChange={handleObraChange}
        />
        <datalist id="lista-obras">
          {lista_obras.map((obra) => (
            <option key={obra.id} value={obra.nombre_obra}></option>
          ))}
        </datalist>
        <button className="button" onClick={handleEmpezar} style={{ marginTop: 18 }}>
          Empecemos
        </button>
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      </div>
      <div style={{
        position: "fixed",
        top: "50vh",
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        pointerEvents: "none",
        userSelect: "none"
      }}>
        <img
          src={usuario.empresa === "GyE" ? "/gruaman1.1.gif" : "/bomberman1.1.gif"}
          alt={usuario.empresa}
          style={{
            width: "200vw",
            height: "50vh",
            objectFit: "cover",
            borderRadius: 0,
          }}
        />
      </div>
    </div>
  );
}

export default BienvenidaSeleccion;
