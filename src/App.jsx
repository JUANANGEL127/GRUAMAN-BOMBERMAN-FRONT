import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

/**
 * Formulario de portada y registro de datos básicos con estructura y clases compatibles con permiso_trabajo.css
 */
function App() {
  const [nombre_trabajador, set_nombre_trabajador] = useState("");
  const [lista_nombres, set_lista_nombres] = useState([]);
  const [filtro_nombre, set_filtro_nombre] = useState("");
  const [empresa, set_empresa] = useState("");
  const [obra, set_obra] = useState("");
  const [numero_identificacion, set_numero_identificacion] = useState("");
  const [mensaje, set_mensaje] = useState("");
  const [faltan_datos_mensaje, set_faltan_datos_mensaje] = useState("");
  const [lista_obras, set_lista_obras] = useState([]);
  const [obra_busqueda, set_obra_busqueda] = useState("");
  const [obra_id_seleccionada, set_obra_id_seleccionada] = useState("");
  const [ubicacion, set_ubicacion] = useState({ lat: null, lon: null });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:3000/nombres_trabajadores")
      .then(res => {
        let nombres = [];
        if (Array.isArray(res.data)) {
          nombres = res.data;
        } else if (Array.isArray(res.data.nombres)) {
          nombres = res.data.nombres;
        }
        nombres.sort((a, b) => a.localeCompare(b));
        set_lista_nombres(nombres);
      })
      .catch(() => set_lista_nombres([]));
  }, []);

  useEffect(() => {
    axios.get("http://localhost:3000/obras")
      .then(res => {
        let obras = [];
        if (Array.isArray(res.data.obras)) {
          obras = res.data.obras;
        }
        set_lista_obras(obras);
      })
      .catch(() => set_lista_obras([]));
  }, []);

  const handle_obra_change = e => {
    const nombre_obra = e.target.value;
    set_obra_busqueda(nombre_obra);
    const obra_obj = lista_obras.find(o => o.nombre_obra === nombre_obra);
    if (obra_obj) {
      set_obra_id_seleccionada(obra_obj.id);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => set_ubicacion({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => set_ubicacion({ lat: null, lon: null })
        );
      }
    } else {
      set_obra_id_seleccionada("");
      set_ubicacion({ lat: null, lon: null });
    }
  };

  const handle_guardar = async () => {
    if (faltan_campos) {
      set_faltan_datos_mensaje("Por favor completa todos los campos obligatorios.");
      setTimeout(() => set_faltan_datos_mensaje(""), 2000);
      return;
    }
    if (
      !obra_id_seleccionada ||
      ubicacion.lat === null ||
      ubicacion.lon === null
    ) {
      set_faltan_datos_mensaje("No se pudo obtener la ubicación. Activa la ubicación y selecciona la obra nuevamente.");
      setTimeout(() => set_faltan_datos_mensaje(""), 2000);
      return;
    }
    try {
      localStorage.setItem("nombre_trabajador", nombre_trabajador);
      localStorage.setItem("empresa", empresa);
      localStorage.setItem("empresa_id", empresa === "GyE" ? 1 : empresa === "AIC" ? 2 : "");
      localStorage.setItem("obra_id", obra_id_seleccionada);
      localStorage.setItem("obra", obra_busqueda);
      localStorage.setItem("numero_identificacion", numero_identificacion);
      localStorage.setItem("lat", ubicacion.lat);
      localStorage.setItem("lon", ubicacion.lon);

      // Solo envía los campos que el backend espera (como antes de los cambios)
      const payload = {
        nombre: nombre_trabajador,
        empresa,
        empresa_id: empresa === "GyE" ? 1 : empresa === "AIC" ? 2 : null,
        obra_id: obra_id_seleccionada,
        numero_identificacion: numero_identificacion
      };

      await axios.post("http://localhost:3000/datos_basicos", payload);
      const resp = await axios.post("http://localhost:3000/validar_ubicacion", {
        obra_id: obra_id_seleccionada,
        lat: ubicacion.lat,
        lon: ubicacion.lon
      });
      if (resp.data && resp.data.ok) {
        alert("Información guardada con éxito");
        set_mensaje("Datos guardados correctamente.");
        setTimeout(() => {
          if (empresa === "GyE") {
            navigate("/eleccion");
          } else if (empresa === "AIC") {
            navigate("/eleccionaic");
          }
        }, 500);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        set_mensaje(
          `Error: ${err.response.data?.mensaje || err.response.data?.error || err.message}`
        );
      } else {
        set_mensaje("Error al guardar datos");
      }
    }
  };

  const campos_obligatorios = {
    nombre_trabajador,
    numero_identificacion,
    empresa,
    obra_id_seleccionada
  };
  const faltan_campos = Object.values(campos_obligatorios).some(v => !v);

  const nombres_filtrados = (Array.isArray(lista_nombres) ? lista_nombres : []).filter(nombre =>
    nombre.toLowerCase().includes(filtro_nombre.toLowerCase())
  );
  const obras_filtradas = (Array.isArray(lista_obras) ? lista_obras : []).filter(
    obra => obra && obra.nombre_obra && obra.nombre_obra.toLowerCase().includes(obra_busqueda.toLowerCase())
  );

  return (
    <div className="form-container" style={{ paddingBottom: 120 }}>
      <div className="card-section">
        <h3 className="card-title">Déjanos conocerte</h3>
        <label className="label">
          Catedral 
          {!obra_id_seleccionada && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
        </label>
        <input
          className="input"
          list="lista-obras"
          placeholder="Buscar o selecciona la obra"
          value={obra_busqueda}
          onChange={handle_obra_change}
        />
        <datalist id="lista-obras">
          {obras_filtradas.map((obra) => (
            <option key={obra.id} value={obra.nombre_obra}></option>
          ))}
        </datalist>
      </div>
      <div className="card-section">
        <label className="label">
          ¿Cuál es tu nombre?
          {!nombre_trabajador && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
        </label>
        <input
          className="input"
          list="lista-nombres"
          placeholder="Buscar o selecciona tu nombre"
          value={nombre_trabajador}
          onChange={e => set_nombre_trabajador(e.target.value)}
        />
        <datalist id="lista-nombres">
          {(Array.isArray(lista_nombres) ? lista_nombres : []).map((nombre, idx) => (
            <option key={idx} value={nombre} />
          ))}
        </datalist>
      </div>
      <div className="card-section">
        <label className="label">
          ¿Cómo es tu número de identificación?
          Digítalo sin puntos ni comas 
          {!numero_identificacion && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
        </label>
        <input
          className="input"
          type="text"
          value={numero_identificacion}
          onChange={e => set_numero_identificacion(e.target.value)}
        />
      </div>
      <div className="card-section">
        <label className="label">
          ¿Tu eres?...
          {!empresa && <span style={{ color: "red", marginLeft: 4 }}>*</span>}
        </label>
      </div>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "16px", marginBottom: 24 }}>
        <div className="card-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 180, padding: 18 }}>
          <button
            type="button"
            className={`empresa-boton${empresa === "GyE" ? " selected" : ""}`}
            style={{
              maxWidth: "140px",
              height: "140px",
              padding: 0,
              background: empresa === "GyE" ? "#1976d2" : undefined,
              border: empresa === "GyE" ? "2px solid #1976d2" : "2px solid #90caf9"
            }}
            onClick={() => set_empresa("GyE")}
          >
            <img src="/gruaman.png" alt="GyE" className="empresa-img" style={{ width: "115px", height: "115px" }} />
          </button>
          <span className="label" style={{ marginTop: "8px" }}>GruaMan</span>
        </div>
        <div className="card-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 220, padding: 18 }}>
          <button
            type="button"
            className={`empresa-boton${empresa === "AIC" ? " selected" : ""}`}
            style={{
              maxWidth: "220px",
              height: "140px",
              padding: 0,
              background: empresa === "AIC" ? "#ffa726" : undefined,
              border: empresa === "AIC" ? "2px solid #ffa726" : "2px solid #90caf9"
            }}
            onClick={() => set_empresa("AIC")}
          >
            <img src="/bomberman.png" alt="AIC" className="empresa-img" style={{ width: "161px", height: "115px" }} />
          </button>
          <span className="label" style={{ marginTop: "8px" }}>BomberMan</span>
        </div>
      </div>
      <button className="button" onClick={handle_guardar} style={{ position: "relative", zIndex: 2 }}>
        Guardar
      </button>
      {faltan_datos_mensaje && (
        <p className="label" style={{ color: "red", marginBottom: "22px" }}>{faltan_datos_mensaje}</p>
      )}
      <p className="label">{mensaje}</p>
    </div>
  );
}

export default App;