import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

/**
 * Pantalla posterior a la autenticación donde el trabajador selecciona su obra activa.
 *
 * Obtiene la lista de obras activas desde la API, solicita la geolocalización y
 * valida la posición del trabajador respecto al sitio seleccionado antes de navegar
 * al flujo de juego o a la pantalla lite de selección de formularios.
 *
 * @param {Object} props
 * @param {{ nombre: string, empresa: string, numero_identificacion: string }} props.usuario
 *   Datos del trabajador autenticado retornados por CedulaIngreso.
 */
function BienvenidaSeleccion({ usuario }) {
  const isLite = sessionStorage.getItem('lite_mode') === 'true';
  const [obra_busqueda, setObraBusqueda] = useState("");
  const [lista_obras, setListaObras] = useState([]);
  const [obra_id_seleccionada, setObraIdSeleccionada] = useState("");
  const [ubicacion, setUbicacion] = useState({ lat: null, lon: null });
  const [error, setError] = useState("");
  const [mostrarBocadillo, setMostrarBocadillo] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setMostrarBocadillo(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/obras`)
      .then(res => {
        const obrasActivas = (res.data.obras || []).filter(o => o.activa === true);
        setListaObras(obrasActivas);
      })
      .catch(() => setListaObras([]));
  }, []);

  useEffect(() => {
    if (!usuario) return;
    try {
      localStorage.setItem("usuario", JSON.stringify(usuario));
      if (usuario.nombre) localStorage.setItem("nombre_trabajador", usuario.nombre);
      if (usuario.numero_identificacion) localStorage.setItem("cedula_trabajador", usuario.numero_identificacion);
      if (usuario.empresa) localStorage.setItem("empresa_trabajador", usuario.empresa);
      const cargo = usuario.cargo || usuario.cargo_trabajador || usuario.puesto;
      if (cargo) localStorage.setItem("cargo_trabajador", cargo);
    } catch {
      // localStorage not available — continue without persistence
    }
  }, [usuario]);

  /**
   * Sincroniza la obra seleccionada en localStorage y solicita la geolocalización.
   * Limpia los datos de obra persistidos cuando el campo se vacía.
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleObraChange = e => {
    const nombre_obra = e.target.value;
    setObraBusqueda(nombre_obra);
    const obra_obj = lista_obras.find(o => o.nombre_obra === nombre_obra);
    if (obra_obj) {
      setObraIdSeleccionada(obra_obj.id);
      try {
        localStorage.setItem("obra", obra_obj.nombre_obra || "");
        localStorage.setItem("obra_id", String(obra_obj.id || ""));
        if (obra_obj.constructora) localStorage.setItem("constructora", obra_obj.constructora);
        if (obra_obj.nombre_obra) localStorage.setItem("nombre_proyecto", obra_obj.nombre_obra);
      } catch {
        // localStorage not available
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
      } catch {
        // localStorage not available
      }
    }
  };

  /**
   * Valida la geolocalización del trabajador frente a la obra seleccionada mediante la API.
   * Al tener éxito, redirige al flujo de juego o a la pantalla lite de selección de formularios.
   */
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
        const obra_obj = lista_obras.find(o => o.id === obra_id_seleccionada);
        if (obra_obj) {
          try {
            localStorage.setItem("obra", obra_obj.nombre_obra || "");
            localStorage.setItem("obra_id", String(obra_obj.id || ""));
            if (obra_obj.constructora) localStorage.setItem("constructora", obra_obj.constructora);
            if (obra_obj.nombre_obra) localStorage.setItem("nombre_proyecto", obra_obj.nombre_obra);
          } catch {
            // localStorage not available
          }
        }
        // Only GyE (empresa_id=1) and AIC/Bomberman (empresa_id=2) use the game flow.
        // SST, Lideres and any other empresa always go to their classic form screens.
        const empresasConJuego = ["GyE", "AIC"];
        const usaJuego = empresasConJuego.includes(usuario.empresa) &&
                         sessionStorage.getItem('lite_mode') !== 'true';

        if (usaJuego) {
          const character = usuario.empresa === "GyE" ? "gruaman" : "bomberman";
          localStorage.setItem("selectedCharacter", character);
          navigate("/game/rotate-screen");
        } else {
          const formRoute = usuario.empresa === "GyE"       ? "/eleccion"
                          : usuario.empresa === "Lideres"  ? "/eleccion_lideres"
                          : usuario.empresa === "SST"      ? "/eleccion_sst"
                          : usuario.empresa === "Tecnicos" ? "/eleccion_tecnicos"
                          : "/eleccionaic";
          navigate(formRoute);
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
      {mostrarBocadillo && sessionStorage.getItem('lite_mode') !== 'true' && (
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
            transition: "opacity 0.5s ease-out",
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
      )}
      <div className="card-section" style={{ alignItems: "center", textAlign: "center" }}>
        <h2 className="card-title" style={{ marginBottom: 18 }}>Selecciona la catedral que deseas construir hoy</h2>
        <input
          className="input"
          list="lista-obras"
          placeholder="Buscar o selecciona la obra"
          value={obra_busqueda}
          onChange={handleObraChange}
          style={isLite ? { background: "#f7faff", border: "1.5px solid #c5d5ea" } : undefined}
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
      {sessionStorage.getItem('lite_mode') !== 'true' && (
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
            src={usuario.empresa === "GyE" ? "/gruaman1.1.gif" : (usuario.empresa === "Lideres" ? "/bomberman1.1.gif" : "/bomberman1.1.gif")}
            alt={usuario.empresa}
            style={{
              width: "200vw",
              height: "50vh",
              objectFit: "cover",
              borderRadius: 0,
            }}
          />
        </div>
      )}
    </div>
  );
}

export default BienvenidaSeleccion;
