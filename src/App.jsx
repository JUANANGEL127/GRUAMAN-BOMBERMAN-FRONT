import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import axios from "axios";

function App() {
  const [nombreTrabajador, setNombreTrabajador] = useState("");
  const [listaNombres, setListaNombres] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [obra, setObra] = useState("");
  const [numeroIdentificacion, setNumeroIdentificacion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [faltanDatosMensaje, setFaltanDatosMensaje] = useState("");
  const [listaObras, setListaObras] = useState([]);
  const [obraBusqueda, setObraBusqueda] = useState("");
  const [obraIdSeleccionada, setObraIdSeleccionada] = useState("");
  const [ubicacion, setUbicacion] = useState({ lat: null, lon: null });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:3000/nombres-trabajadores")
      .then(res => {
        let nombres = [];
        if (Array.isArray(res.data)) {
          nombres = res.data;
        } else if (Array.isArray(res.data.nombres)) {
          nombres = res.data.nombres;
        }
        nombres.sort((a, b) => a.localeCompare(b));
        setListaNombres(nombres);
      })
      .catch(() => setListaNombres([]));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:3000/obras")
      .then(res => {
        let obras = [];
        if (Array.isArray(res.data.obras)) {
          obras = res.data.obras;
        }
        setListaObras(obras);
      })
      .catch(() => setListaObras([]));
  }, []);

  // Cuando el usuario selecciona una obra, busca el id y pide la ubicación
  const handleObraChange = e => {
    const nombreObra = e.target.value;
    setObraBusqueda(nombreObra);
    const obraObj = listaObras.find(o => o.nombreObra === nombreObra);
    if (obraObj) {
      setObraIdSeleccionada(obraObj.id);
      // Obtener ubicación
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => setUbicacion({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => setUbicacion({ lat: null, lon: null })
        );
      }
    } else {
      setObraIdSeleccionada("");
      setUbicacion({ lat: null, lon: null });
    }
  };

  const handleGuardar = async () => {
    if (faltanCampos) {
      setFaltanDatosMensaje("Por favor completa todos los campos obligatorios.");
      setTimeout(() => setFaltanDatosMensaje(""), 2000);
      return;
    }
    if (
      !obraIdSeleccionada ||
      ubicacion.lat === null ||
      ubicacion.lon === null
    ) {
      setFaltanDatosMensaje("No se pudo obtener la ubicación. Activa la ubicación y selecciona la obra nuevamente.");
      setTimeout(() => setFaltanDatosMensaje(""), 2000);
      return;
    }
    try {
      const resp = await axios.post("http://localhost:3000/validar-ubicacion", {
        obraId: obraIdSeleccionada,
        lat: ubicacion.lat,
        lon: ubicacion.lon
      });
      if (resp.data && resp.data.ok) {
        alert("Información guardada con éxito");
        setMensaje("Datos guardados correctamente.");
        setTimeout(() => {
          if (empresa === "GyE") {
            navigate("/eleccion");
          } else if (empresa === "AIC") {
            navigate("/eleccionaic");
          }
        }, 500);
      }
    } catch (err) {
      if (err.response && err.response.status === 403) {
        alert(err.response.data?.mensaje || "No autorizado para registrar ubicación.");
      } else if (err.response && err.response.data?.mensaje) {
        setMensaje(err.response.data.mensaje);
      } else {
        setMensaje("Error al guardar datos");
      }
    }
  };

  const camposObligatorios = {
    nombreTrabajador,
    numeroIdentificacion,
    empresa,
    obraIdSeleccionada // ahora se valida el id de la obra seleccionada
  };
  const faltanCampos = Object.values(camposObligatorios).some(v => !v);

  // Filtrar nombres según el texto de búsqueda
  const nombresFiltrados = (Array.isArray(listaNombres) ? listaNombres : []).filter(nombre =>
    nombre.toLowerCase().includes(filtroNombre.toLowerCase())
  );

  // Filtrar obras según el texto de búsqueda
  const obrasFiltradas = (Array.isArray(listaObras) ? listaObras : []).filter(
    obra => obra && obra.nombreObra && obra.nombreObra.toLowerCase().includes(obraBusqueda.toLowerCase())
  );

  return (
    <div className="app-container">
      <h2>Déjanos conocerte</h2>
      <div className="app-group">
        <label className="app-label">
          ¿Cuál es tu nombre?
          {!nombreTrabajador && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
        </label>
        <input
          className="app-input"
          list="lista-nombres"
          placeholder="Buscar o selecciona tu nombre"
          value={nombreTrabajador}
          onChange={e => setNombreTrabajador(e.target.value)}
        />
        <datalist id="lista-nombres">
          {(Array.isArray(listaNombres) ? listaNombres : []).map((nombre, idx) => (
            <option key={idx} value={nombre} />
          ))}
        </datalist>
      </div>
      <div className="app-group">
        <label className="app-label">
          ¿Cómo es tu número de identificación?
          Digítalo sin puntos ni comas 
          {!numeroIdentificacion && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
        </label>
        <input
          className="app-input"
          type="text"
          value={numeroIdentificacion}
          onChange={e => setNumeroIdentificacion(e.target.value)}
        />
      </div>
      <div className="app-group">
        <label className="app-label">
          ¿Tu eres?...
          {!empresa && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
        </label>
      </div>
      <div className="app-group" style={{ flexDirection: "row", justifyContent: "center", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <button
            type="button"
            className={`app-boton empresa-boton${empresa === "GyE" ? " selected" : ""}`}
            style={{
              maxWidth: "140px",
              height: "140px",
              padding: 0,
              background: empresa === "GyE" ? "#1976d2" : undefined,
              border: empresa === "GyE" ? "2px solid #1976d2" : "2px solid #90caf9"
            }}
            onClick={() => setEmpresa("GyE")}
          >
            <img src="/gruaman.png" alt="GyE" className="empresa-img" style={{ width: "115px", height: "115px" }} />
          </button>
          <span className="app-label" style={{ marginTop: "8px" }}>GruaMan</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <button
            type="button"
            className={`app-boton empresa-boton${empresa === "AIC" ? " selected" : ""}`}
            style={{
              maxWidth: "220px",
              height: "140px",
              padding: 0,
              background: empresa === "AIC" ? "#ffa726" : undefined,
              border: empresa === "AIC" ? "2px solid #ffa726" : "2px solid #90caf9"
            }}
            onClick={() => setEmpresa("AIC")}
          >
            <img src="/bomberman.png" alt="AIC" className="empresa-img" style={{ width: "161px", height: "115px" }} />
          </button>
          <span className="app-label" style={{ marginTop: "8px" }}>BomberMan</span>
        </div>
      </div>
      <div className="app-group">
        <label className="app-label">
          ¿En qué obra estás trabajando?
          {!obraIdSeleccionada && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
        </label>
        <input
          className="app-input"
          list="lista-obras"
          placeholder="Buscar o selecciona la obra"
          value={obraBusqueda}
          onChange={handleObraChange}
        />
        <datalist id="lista-obras">
          {obrasFiltradas.map((obra) => (
            <option key={obra.id} value={obra.nombreObra} />
          ))}
        </datalist>
      </div>
      <button className="app-boton" onClick={handleGuardar}>
        Guardar
      </button>
      {faltanDatosMensaje && (
        <p className="app-mensaje" style={{ color: "red", marginBottom: "32px" }}>{faltanDatosMensaje}</p>
      )}
      <p className="app-mensaje">{mensaje}</p>
    </div>
  );
}

export default App;
