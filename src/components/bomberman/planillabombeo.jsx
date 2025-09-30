import { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/bomberman/planillabombeo.css";

const filasTabla = 11;

function PlanillaBombeo() {
  // Estado para los datos del formulario
  const [datos, setDatos] = useState({
    cliente: "",
    proyecto: "",
    fecha: "",
    bomba: "",
    horaLlegadaObra: "",
    horaSalidaObra: "",
    remisiones: Array.from({ length: filasTabla }, () => ({
      remision: "",
      horaLlegada: "",
      horaInicial: "",
      horaFinal: "",
      metros: "",
      observaciones: ""
    })),
    acpmInicio: "",
    acpmFinal: "",
    horometroInicial: "",
    horometroFinal: "",
    operador: "", // inicializa aquí
    auxiliar: "",
    totalMetros: "",
    clienteNombre: "",
    clienteCC: ""
  });

  // Estado para la lista de nombres auxiliares
  const [listaNombres, setListaNombres] = useState([]);
  const [busquedaAuxiliar, setBusquedaAuxiliar] = useState("");

  // Obtener nombre operador de localStorage (igual que nombre proyecto)
  const nombreOperador = localStorage.getItem("nombreTrabajador") || "";

  // Al cargar, autollenar campos desde localStorage
  useEffect(() => {
    const nombreObra = localStorage.getItem("obra") || "";
    const fechaHoy = new Date().toISOString().slice(0, 10);

    setDatos(prev => ({
      ...prev,
      proyecto: nombreObra,
      fecha: fechaHoy,
      operador: nombreOperador // ahora toma el operador igual que nombre proyecto
    }));
  }, [nombreOperador]);

  // Cargar lista de nombres desde el backend
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

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handleRemisionChange = (idx, field, value) => {
    const nuevasRemisiones = datos.remisiones.map((r, i) =>
      i === idx ? { ...r, [field]: value } : r
    );
    setDatos({ ...datos, remisiones: nuevasRemisiones });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    const toNumberOrZero = (val) => {
      if (val === undefined || val === null || val === "") return 0;
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    const toStringOrEmpty = (val) => (val === undefined || val === null ? "" : String(val));

    // Incluye todos los campos requeridos por la tabla, aunque estén vacíos
    const payload = {
      nombre_cliente: toStringOrEmpty(datos.cliente),
      nombre_proyecto: toStringOrEmpty(datos.proyecto),
      fecha_servicio: toStringOrEmpty(datos.fecha),
      bomba_numero: toStringOrEmpty(datos.bomba),
      hora_llegada_obra: toStringOrEmpty(datos.horaLlegadaObra),
      hora_salida_obra: toStringOrEmpty(datos.horaSalidaObra),
      hora_inicio_acpm: toNumberOrZero(datos.acpmInicio),
      hora_final_acpm: toNumberOrZero(datos.acpmFinal),
      horometro_inicial: toNumberOrZero(datos.horometroInicial),
      horometro_final: toNumberOrZero(datos.horometroFinal),
      nombre_operador: toStringOrEmpty(datos.operador),
      nombre_auxiliar: toStringOrEmpty(datos.auxiliar),
      total_metros_cubicos_bombeados: toNumberOrZero(datos.totalMetros),
      // Si el backend requiere estos campos, agrégalos también:
      nombre_cliente_aceptacion: toStringOrEmpty(datos.clienteNombre),
      cc_cliente_aceptacion: toStringOrEmpty(datos.clienteCC)
    };

    console.log("Payload enviado:", payload);

    try {
      const res = await fetch("http://localhost:3000/bomberman/planillabombeo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const resText = await res.text();
      console.log("Respuesta backend:", res.status, resText);
      if (!res.ok) throw new Error(resText || "Error al guardar");
      alert("Guardado exitosamente");
    } catch (err) {
      alert("Error al guardar: " + err.message);
    }
  };

  // Función para obtener la hora actual en formato HH:MM
  const getHoraActual = () => {
    const now = new Date();
    return now.toTimeString().slice(0,5);
  };

  // Filtrar lista de auxiliares según búsqueda
  const listaFiltrada = listaNombres.filter(nombre =>
    nombre.toLowerCase().includes(busquedaAuxiliar.toLowerCase())
  );

  return (
    <div className="app-container">
      <h2>Control de Bombeo</h2>
      <form>
        <div className="app-group">
          <label className="app-label">Nombre del Cliente</label>
          <input className="app-input" name="cliente" value={datos.cliente} onChange={handleChange} />
        </div>
        <div className="app-group">
          <label className="app-label">Nombre Proyecto</label>
          <input
            className="app-input"
            name="proyecto"
            value={datos.proyecto}
            onChange={handleChange}
            readOnly
          />
        </div>
        <div className="app-group" style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="app-label">Fecha Servicio</label>
            <input
              className="app-input"
              type="date"
              name="fecha"
              value={datos.fecha}
              onChange={handleChange}
              readOnly
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="app-label">Bomba #</label>
            <input className="app-input" name="bomba" value={datos.bomba} onChange={handleChange} />
          </div>
        </div>
        <div className="app-group" style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="app-label">Hora Llegada Obra</label>
            <div style={{ width: "100%" }}>
              <input
                className="app-input"
                type="time"
                name="horaLlegadaObra"
                value={datos.horaLlegadaObra}
                readOnly
                tabIndex={-1}
                style={{ width: "100%" }}
              />
              <button
                type="button"
                className="app-button"
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: "10px 0",
                  fontSize: 14,
                  marginTop: 4
                }}
                onClick={() => setDatos({ ...datos, horaLlegadaObra: getHoraActual() })}
              >
                Registrar hora
              </button>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label className="app-label">Hora Salida Obra</label>
            <div style={{ width: "100%" }}>
              <input
                className="app-input"
                type="time"
                name="horaSalidaObra"
                value={datos.horaSalidaObra}
                readOnly
                tabIndex={-1}
                style={{ width: "100%" }}
              />
              <button
                type="button"
                className="app-button"
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: "10px 0",
                  fontSize: 14,
                  marginTop: 4
                }}
                onClick={() => setDatos({ ...datos, horaSalidaObra: getHoraActual() })}
              >
                Registrar hora
              </button>
            </div>
          </div>
        </div>
        {/*<div className="app-group" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>N°</th>
                <th>N° Remisión</th>
                <th>Hora Llegada</th>
                <th>Hora Inicial</th>
                <th>Hora Final</th>
                <th>M³</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {datos.remisiones.map((r, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <input
                      className="app-input"
                      style={{ minWidth: 60 }}
                      value={r.remision}
                      onChange={e => handleRemisionChange(idx, "remision", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="app-input"
                      style={{ minWidth: 80 }}
                      value={r.horaLlegada}
                      onChange={e => handleRemisionChange(idx, "horaLlegada", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="app-input"
                      style={{ minWidth: 80 }}
                      value={r.horaInicial}
                      onChange={e => handleRemisionChange(idx, "horaInicial", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="app-input"
                      style={{ minWidth: 80 }}
                      value={r.horaFinal}
                      onChange={e => handleRemisionChange(idx, "horaFinal", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="app-input"
                      style={{ minWidth: 60 }}
                      value={r.metros}
                      onChange={e => handleRemisionChange(idx, "metros", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="app-input"
                      style={{ minWidth: 100 }}
                      value={r.observaciones}
                      onChange={e => handleRemisionChange(idx, "observaciones", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> */}
        <div className="app-group" style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="app-label">Inicio ACPM</label>
            <input className="app-input" name="acpmInicio" value={datos.acpmInicio} onChange={handleChange} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="app-label">Final ACPM</label>
            <input className="app-input" name="acpmFinal" value={datos.acpmFinal} onChange={handleChange} />
          </div>
        </div>
        <div className="app-group" style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="app-label">Horómetros Inicial</label>
            <input className="app-input" name="horometroInicial" value={datos.horometroInicial} onChange={handleChange} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="app-label">Horómetros Final</label>
            <input className="app-input" name="horometroFinal" value={datos.horometroFinal} onChange={handleChange} />
          </div>
        </div>
        <div className="app-group">
          <label className="app-label">Nombre Operador</label>
          <input
            className="app-input"
            name="operador"
            value={datos.operador}
            readOnly
            tabIndex={-1}
          />
        </div>
        <div className="app-group">
          <label className="app-label">Nombre Auxiliar</label>
          <input
            className="app-input"
            list="lista-nombres-auxiliares"
            placeholder="Buscar o selecciona auxiliar"
            value={busquedaAuxiliar || datos.auxiliar}
            onChange={e => {
              setBusquedaAuxiliar(e.target.value);
              setDatos({ ...datos, auxiliar: e.target.value });
            }}
            autoComplete="off"
          />
          <datalist id="lista-nombres-auxiliares">
            {listaNombres.map((nombre, idx) => (
              <option key={idx} value={nombre} />
            ))}
          </datalist>
        </div>
        <div className="app-group" style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="app-label">Total M³ Bombeados</label>
            <input className="app-input" name="totalMetros" value={datos.totalMetros} onChange={handleChange} />
          </div>
        </div>
        <div className="app-group">
          <label className="app-label">Aceptación Cliente - Nombre y Apellido</label>
          <input className="app-input" name="clienteNombre" value={datos.clienteNombre} onChange={handleChange} />
        </div>
        <div className="app-group">
          <label className="app-label">C.C.</label>
          <input className="app-input" name="clienteCC" value={datos.clienteCC} onChange={handleChange} />
        </div>
        <div className="app-group" style={{ marginTop: 16 }}>
          <button type="button" className="app-button" onClick={handleGuardar}>
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

export default PlanillaBombeo;

