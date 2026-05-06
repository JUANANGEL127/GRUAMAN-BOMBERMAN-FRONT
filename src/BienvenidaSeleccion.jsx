import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./features/auth/hooks/useAuth";
import { getCompanySlug } from "./features/auth/adapters/authSessionAdapter";
import { consumeReturnTo } from "./features/auth/utils/returnTo";
import api from "./utils/api";

function useIsLandscape() {
  const [landscape, setLandscape] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(orientation: landscape) and (max-height: 500px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
    const handleChange = (event) => setLandscape(event.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return landscape;
}

function resolveUsuarioDesdeSesion(session) {
  const user = session?.user;
  if (!user) return null;

  const legacyProfile = session?.legacyProfile;

  return {
    nombre: user.name || legacyProfile?.nombre_trabajador || "",
    empresa: getCompanySlug(
      legacyProfile?.empresa_trabajador || user.companyName || user.companySlug || ""
    ),
    numero_identificacion: user.documentId || legacyProfile?.cedula_trabajador || "",
    cargo: legacyProfile?.cargo_trabajador || user.cargo || "",
  };
}

function resolveWorkerLandingPath(usuario, isLite) {
  const empresa = getCompanySlug(usuario?.empresa || "");
  const empresasConJuego = ["GyE", "AIC"];
  const usaJuego = empresasConJuego.includes(empresa) && !isLite;

  if (usaJuego) {
    const character = empresa === "GyE" ? "gruaman" : "bomberman";
    try {
      localStorage.setItem("selectedCharacter", character);
    } catch {
      // Local UI metadata is optional.
    }
    return "/game/rotate-screen";
  }

  if (empresa === "GyE") return "/eleccion";
  if (empresa === "Lideres") return "/eleccion_lideres";
  if (empresa === "SST") return "/eleccion_sst";
  if (empresa === "Tecnicos") return "/eleccion_tecnicos";
  return "/eleccionaic";
}

/**
 * Pantalla posterior a la autenticación donde el trabajador selecciona su obra activa.
 *
 * Obtiene la lista de obras activas desde la API, solicita la geolocalización y
 * valida la posición del trabajador respecto al sitio seleccionado antes de navegar
 * al flujo de juego o a la pantalla lite de selección de formularios.
 *
 * @param {Object} props
 * @param {{ nombre?: string, empresa?: string, numero_identificacion?: string, cargo?: string }} [props.usuario]
 *   Datos del trabajador autenticado retornados por CedulaIngreso o rehidratados desde la sesión.
 */
function BienvenidaSeleccion({ usuario }) {
  const { session } = useAuth();
  const usuarioAutenticado = useMemo(
    () => usuario || resolveUsuarioDesdeSesion(session) || {},
    [session, usuario]
  );
  const isLite = typeof window !== "undefined" && sessionStorage.getItem("lite_mode") === "true";
  const isLandscape = useIsLandscape();
  const [obraBusqueda, setObraBusqueda] = useState("");
  const [listaObras, setListaObras] = useState([]);
  const [obraIdSeleccionada, setObraIdSeleccionada] = useState("");
  const [ubicacion, setUbicacion] = useState({ lat: null, lon: null });
  const [gpsEstado, setGpsEstado] = useState("idle");
  const [error, setError] = useState("");
  const [mostrarBocadillo, setMostrarBocadillo] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setMostrarBocadillo(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    api
      .get("/obras")
      .then((response) => {
        const obrasActivas = (response.data?.obras || []).filter((obra) => obra?.activa === true);
        setListaObras(obrasActivas);
      })
      .catch(() => setListaObras([]));
  }, []);

  useEffect(() => {
    if (!usuarioAutenticado?.nombre && !usuarioAutenticado?.numero_identificacion) return;

    try {
      localStorage.setItem("usuario", JSON.stringify(usuarioAutenticado));
      if (usuarioAutenticado.nombre) localStorage.setItem("nombre_trabajador", usuarioAutenticado.nombre);
      if (usuarioAutenticado.numero_identificacion) {
        localStorage.setItem("cedula_trabajador", usuarioAutenticado.numero_identificacion);
      }
      if (usuarioAutenticado.empresa) {
        localStorage.setItem("empresa_trabajador", usuarioAutenticado.empresa);
      }
      if (usuarioAutenticado.cargo) {
        localStorage.setItem("cargo_trabajador", usuarioAutenticado.cargo);
      }
    } catch {
      // Local persistence is optional UI metadata only.
    }
  }, [usuarioAutenticado]);

  const requestGPS = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsEstado("error");
      setError("Este dispositivo no soporta geolocalización.");
      return;
    }

    setGpsEstado("cargando");
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUbicacion({ lat: position.coords.latitude, lon: position.coords.longitude });
        setGpsEstado("ok");
      },
      () => {
        setUbicacion({ lat: null, lon: null });
        setGpsEstado("error");
        setError("No se pudo obtener tu ubicación. Activa el GPS e intenta de nuevo.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const handleObraChange = (event) => {
    const nombreObra = event.target.value;
    setObraBusqueda(nombreObra);
    const obraSeleccionada = listaObras.find((obra) => obra?.nombre_obra === nombreObra);

    if (obraSeleccionada) {
      setObraIdSeleccionada(String(obraSeleccionada.id || ""));
      try {
        localStorage.setItem("obra", obraSeleccionada.nombre_obra || "");
        localStorage.setItem("obra_id", String(obraSeleccionada.id || ""));
        if (obraSeleccionada.constructora) localStorage.setItem("constructora", obraSeleccionada.constructora);
        if (obraSeleccionada.nombre_obra) localStorage.setItem("nombre_proyecto", obraSeleccionada.nombre_obra);
      } catch {
        // Local persistence is optional UI metadata only.
      }
      requestGPS();
      return;
    }

    setObraIdSeleccionada("");
    setUbicacion({ lat: null, lon: null });
    setGpsEstado("idle");
    setError("");
    try {
      localStorage.removeItem("obra");
      localStorage.removeItem("obra_id");
      localStorage.removeItem("constructora");
      localStorage.removeItem("nombre_proyecto");
    } catch {
      // Ignore local cleanup failures.
    }
  };

  const validarYNavegar = async (coords) => {
    try {
      const response = await api.post(
        "/validar_ubicacion",
        {
          obra_id: obraIdSeleccionada,
          lat: coords.lat,
          lon: coords.lon,
        }
      );

      if (response.data?.ok) {
        const obraSeleccionada = listaObras.find((obra) => String(obra?.id || "") === String(obraIdSeleccionada));
        if (obraSeleccionada) {
          try {
            localStorage.setItem("obra", obraSeleccionada.nombre_obra || "");
            localStorage.setItem("obra_id", String(obraSeleccionada.id || ""));
            if (obraSeleccionada.constructora) localStorage.setItem("constructora", obraSeleccionada.constructora);
            if (obraSeleccionada.nombre_obra) localStorage.setItem("nombre_proyecto", obraSeleccionada.nombre_obra);
          } catch {
            // Local persistence is optional UI metadata only.
          }
        }

        const pendingReturnTo = consumeReturnTo();
        const defaultPath = resolveWorkerLandingPath(usuarioAutenticado, isLite);
        navigate(pendingReturnTo || defaultPath, { replace: true });
        return;
      }

      const distancia = response.data?.distancia;
      setError(
        distancia
          ? `Estás a ${distancia >= 1000 ? `${(distancia / 1000).toFixed(1)} km` : `${distancia} m`} de la obra. Debes estar a menos de 500 m.`
          : "No se encuentra en la ubicación seleccionada."
      );
    } catch (requestError) {
      const distancia = requestError.response?.data?.distancia;
      setError(
        distancia
          ? `Estás a ${distancia >= 1000 ? `${(distancia / 1000).toFixed(1)} km` : `${distancia} m`} de la obra. Debes estar a menos de 500 m.`
          : "No se encuentra en la ubicación seleccionada."
      );
    }
  };

  const handleEmpezar = async () => {
    setError("");
    if (!obraIdSeleccionada) {
      setError("Selecciona una catedral primero.");
      return;
    }

    if (ubicacion.lat === null || ubicacion.lon === null) {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setError("Este dispositivo no soporta geolocalización.");
        return;
      }

      setGpsEstado("cargando");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lon: position.coords.longitude };
          setUbicacion(coords);
          setGpsEstado("ok");
          validarYNavegar(coords);
        },
        () => {
          setGpsEstado("error");
          setError("No se pudo obtener tu ubicación. Activa el GPS e intenta de nuevo.");
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
      return;
    }

    await validarYNavegar(ubicacion);
  };

  return (
    <div
      className="form-container"
      style={isLandscape ? { minHeight: "100vh", justifyContent: "center", paddingTop: "1rem", paddingBottom: "1rem" } : undefined}
    >
      {mostrarBocadillo && !isLite && !isLandscape && (
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
              letterSpacing: "1px",
            }}
          >
            <div>Bienvenido</div>
            <div style={{ marginTop: "4px" }}>Super héroe</div>
            <div style={{ marginTop: "4px", fontWeight: 600, fontSize: "1.25rem" }}>
              {usuarioAutenticado?.nombre || ""}
            </div>
          </div>
        </div>
      )}
      <div className="card-section" style={{ alignItems: "center", textAlign: "center" }}>
        <h2 className="card-title" style={{ marginBottom: 18 }}>
          Selecciona la catedral que deseas construir hoy
        </h2>
        <input
          className="input"
          list="lista-obras"
          placeholder="Buscar o selecciona la obra"
          value={obraBusqueda}
          onChange={handleObraChange}
          style={isLite ? { background: "#f7faff", border: "1.5px solid #c5d5ea" } : undefined}
        />
        <datalist id="lista-obras">
          {listaObras.map((obra) => (
            <option key={obra.id} value={obra.nombre_obra} />
          ))}
        </datalist>
        {gpsEstado === "cargando" && (
          <div style={{ color: "#2563eb", marginTop: 10, fontSize: "0.9rem" }}>
            Obteniendo ubicacion GPS...
          </div>
        )}
        {gpsEstado === "ok" && (
          <div style={{ color: "#00A32C", marginTop: 10, fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.3px" }}>
            Ubicacion confirmada
          </div>
        )}
        {gpsEstado === "error" && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ color: "#dc2626", fontSize: "0.9rem" }}>GPS no disponible</div>
            <button className="button" onClick={requestGPS}>
              Reintentar GPS
            </button>
          </div>
        )}
        <button className="button" onClick={handleEmpezar} style={{ marginTop: 18 }}>
          Empecemos
        </button>
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      </div>
      {!isLite && !isLandscape && (
        <div
          style={{
            position: "fixed",
            top: "50vh",
            width: "100vw",
            height: "100vh",
            zIndex: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <img
            src={usuarioAutenticado?.empresa === "GyE" ? "/gruaman1.1.gif" : "/bomberman1.1.gif"}
            alt={usuarioAutenticado?.empresa || "worker-company"}
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
