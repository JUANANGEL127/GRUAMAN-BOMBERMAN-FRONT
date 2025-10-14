import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/bomberman/planillabombeo.css";

function planillabombeo() {
  // Estado para los datos del formulario
  const [datos, setDatos] = useState({
    nombre_cliente: "",
    nombre_proyecto: "",
    fecha_servicio: "",
    bomba_numero: "",
    hora_llegada_obra: "",
    hora_salida_obra: "",
    remision: "",
    hora_llegada: "",
    hora_inicial: "",
    hora_final: "",
    metros: "",
    observaciones: "",
    galones_inicio_acpm: "",
    galones_final_acpm: "",
    galones_pinpina: "", // Nuevo campo
    horometro_inicial: "",
    horometro_final: "",
    nombre_operador: "",
    nombre_auxiliar: "",
    total_metros_cubicos_bombeados: "",
    nombre_cliente_aceptacion: "",
    cc_cliente_aceptacion: ""
  });

  // Estado para la lista de nombres auxiliares
  const [lista_nombres, set_lista_nombres] = useState([]);
  const [busqueda_auxiliar, set_busqueda_auxiliar] = useState("");

  // Estado para las remisiones
  const [remisiones, set_remisiones] = useState([]);
  const [modal_abierto, set_modal_abierto] = useState(false);
  const [remision_actual, set_remision_actual] = useState({
    remision: "",
    hora_llegada: "",
    hora_inicial: "",
    hora_final: "",
    metros: "",
    observaciones: "",
    manguera: "3" // Valor por defecto
  });

  // Estado para la lista de bombas
  const [lista_bombas, set_lista_bombas] = useState([]);

  // Obtener nombre operador de localStorage (igual que nombre proyecto)
  const nombre_operador_local = localStorage.getItem("nombre_trabajador") || "";

  // Al cargar, autollenar campos desde localStorage
  useEffect(() => {
    const nombre_obra = localStorage.getItem("obra") || "";
    const fecha_hoy = new Date().toISOString().slice(0, 10);
    const hora_llegada_obra = localStorage.getItem("hora_llegada_obra") || "";
    const hora_salida_obra = localStorage.getItem("hora_salida_obra") || "";

    setDatos(prev => ({
      ...prev,
      nombre_proyecto: nombre_obra,
      fecha_servicio: fecha_hoy,
      nombre_operador: nombre_operador_local,
      hora_llegada_obra,
      hora_salida_obra
    }));
  }, [nombre_operador_local]);

  // Cargar lista de nombres desde el backend
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

  // Cargar datos de obra y autollenar campos relevantes
  useEffect(() => {
    axios.get("http://localhost:3000/obras")
      .then(res => {
        let obras = [];
        if (Array.isArray(res.data.obras)) {
          obras = res.data.obras;
        }
        // Busca la obra seleccionada en localStorage y extrae constructora
        const nombre_obra = localStorage.getItem("obra") || "";
        const obra_seleccionada = obras.find(o => o.nombre_obra === nombre_obra);
        const constructora = obra_seleccionada ? obra_seleccionada.constructora : "";
        const fecha_hoy = new Date().toISOString().slice(0, 10);

        setDatos(prev => ({
          ...prev,
          nombre_proyecto: nombre_obra,
          fecha_servicio: fecha_hoy,
          nombre_operador: nombre_operador_local,
          nombre_cliente: constructora // Mostrar constructora en campo cliente
        }));
      })
      .catch(() => {
        setDatos(prev => ({
          ...prev,
          nombre_cliente: ""
        }));
      });
  }, [nombre_operador_local]);

  // Cargar lista de bombas desde el backend
  useEffect(() => {
    axios.get("http://localhost:3000/bombas")
      .then(res => {
        let bombas = [];
        if (Array.isArray(res.data.bombas)) {
          bombas = res.data.bombas;
        } else if (Array.isArray(res.data)) {
          bombas = res.data;
        }
        set_lista_bombas(bombas);
      })
      .catch(() => set_lista_bombas([]));
  }, []);

  // Guardar hora_llegada_obra y hora_salida_obra en localStorage cada vez que cambian
  useEffect(() => {
    localStorage.setItem("hora_llegada_obra", datos.hora_llegada_obra || "");
  }, [datos.hora_llegada_obra]);

  useEffect(() => {
    localStorage.setItem("hora_salida_obra", datos.hora_salida_obra || "");
  }, [datos.hora_salida_obra]);

  // Registrar hora y guardar en localStorage inmediatamente
  const registrar_hora_llegada_obra = () => {
    const hora = get_hora_actual();
    localStorage.setItem("hora_llegada_obra", hora);
    setDatos(prev => ({ ...prev, hora_llegada_obra: hora }));
  };

  const registrar_hora_salida_obra = () => {
    const hora = get_hora_actual();
    localStorage.setItem("hora_salida_obra", hora);
    setDatos(prev => ({ ...prev, hora_salida_obra: hora }));
  };

  const handle_change = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handle_remision_change = (e) => {
    set_remision_actual({ ...remision_actual, [e.target.name]: e.target.value });
  };

  const abrir_modal_remision = () => {
    const numero_remision = (remisiones.length + 1).toString();
    set_remision_actual({
      remision: numero_remision,
      hora_llegada: "",
      hora_inicial: "",
      hora_final: "",
      metros: "",
      observaciones: "",
      manguera: "3" // Valor por defecto
    });
    set_modal_abierto(true);
  };

  // Validación en el input de galones (inicio/final acpm y pinpina)
  const handle_galones_change = (e) => {
    let val = e.target.value.replace(/\D/g, ""); // Solo números
    if (val.length > 0 && (Number(val) > 30)) val = "30";
    setDatos({ ...datos, [e.target.name]: val });
  };

  // Validación en el input de metros cúbicos en el modal
  const handle_metros_change = (e) => {
    let val = e.target.value.replace(/[^0-9.]/g, ""); // Solo números y punto
    if (val && Number(val) > 12) val = "12";
    set_remision_actual({ ...remision_actual, metros: val });
  };

  // Validación en el input de horómetros
  const handle_horometro_change = (e) => {
    let val = e.target.value.replace(/\D/g, ""); // Solo números
    if (val.length > 4) val = val.slice(0, 4);
    setDatos({ ...datos, [e.target.name]: val });
  };

  const guardar_remision = () => {
    // Validar metros antes de guardar
    if (!remision_actual.metros || Number(remision_actual.metros) > 12) {
      alert("El valor de metros cúbicos debe ser menor o igual a 12 y puede tener decimales.");
      return;
    }
    const nuevas_remisiones = [...remisiones, remision_actual];
    // Sumar todos los metros de las remisiones guardadas
    const total_metros = nuevas_remisiones.reduce(
      (acc, r) => acc + (parseFloat(r.metros) || 0),
      0
    );
    set_remisiones(nuevas_remisiones);
    setDatos(prev => ({
      ...prev,
      total_metros_cubicos_bombeados: total_metros
    }));
    set_modal_abierto(false);
  };

  const navigate = useNavigate();

  const handle_guardar = async (e) => {
    e.preventDefault();

    // Validar galones de combustible
    if (
      !datos.galones_inicio_acpm ||
      !datos.galones_final_acpm ||
      !datos.galones_pinpina ||
      isNaN(datos.galones_inicio_acpm) ||
      isNaN(datos.galones_final_acpm) ||
      isNaN(datos.galones_pinpina) ||
      datos.galones_inicio_acpm.includes(".") ||
      datos.galones_final_acpm.includes(".") ||
      datos.galones_pinpina.includes(".") ||
      Number(datos.galones_inicio_acpm) > 30 ||
      Number(datos.galones_final_acpm) > 30 ||
      Number(datos.galones_pinpina) > 30
    ) {
      alert("Los galones (Inicio/Final ACPM y Pinpina) deben ser números enteros entre 0 y 30, sin decimales.");
      return;
    }

    // Validar horómetros
    if (
      !datos.horometro_inicial ||
      !datos.horometro_final ||
      datos.horometro_inicial.length > 4 ||
      datos.horometro_final.length > 4
    ) {
      alert("Los horómetros deben tener máximo 4 dígitos.");
      return;
    }

    // Validar remisiones: todos los campos requeridos y formato de hora
    const remisiones_validas = remisiones.every(r =>
      r.remision &&
      r.hora_llegada &&
      r.hora_inicial &&
      r.hora_final &&
      r.metros &&
      !isNaN(Number(r.metros)) &&
      Number(r.metros) > 0 &&
      /^\d{2}:\d{2}$/.test(r.hora_llegada) &&
      /^\d{2}:\d{2}$/.test(r.hora_inicial) &&
      /^\d{2}:\d{2}$/.test(r.hora_final)
    );

    if (!remisiones_validas) {
      alert("Todas las remisiones deben tener los campos completos y las horas en formato HH:MM.");
      return;
    }

    // Construir el payload sin campos de remisión sueltos
    const payload = {
      nombre_cliente: datos.nombre_cliente,
      nombre_proyecto: datos.nombre_proyecto,
      fecha_servicio: datos.fecha_servicio,
      bomba_numero: datos.bomba_numero,
      hora_llegada_obra: datos.hora_llegada_obra,
      hora_salida_obra: datos.hora_salida_obra,
      galones_inicio_acpm: datos.galones_inicio_acpm,
      galones_final_acpm: datos.galones_final_acpm,
      galones_pinpina: datos.galones_pinpina, // Nuevo campo en el envío
      horometro_inicial: datos.horometro_inicial,
      horometro_final: datos.horometro_final,
      nombre_operador: datos.nombre_operador,
      nombre_auxiliar: datos.nombre_auxiliar,
      total_metros_cubicos_bombeados: datos.total_metros_cubicos_bombeados,
      nombre_cliente_aceptacion: datos.nombre_cliente_aceptacion,
      cc_cliente_aceptacion: datos.cc_cliente_aceptacion,
      remisiones: remisiones.map(r => ({
        remision: r.remision,
        hora_llegada: r.hora_llegada,
        hora_inicial: r.hora_inicial,
        hora_final: r.hora_final,
        metros: Number(r.metros),
        observaciones: r.observaciones,
        manguera: r.manguera // Nuevo campo
      }))
    };

    console.log("Payload enviado:", payload);

    try {
      const res = await fetch("http://localhost:3000/bomberman/planilla_bombeo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const res_text = await res.text();
      console.log("Respuesta backend:", res.status, res_text);
      if (!res.ok) throw new Error(res_text || "Error al guardar");
      alert("Guardado exitosamente");
      // Borrar las horas de localStorage después de guardar
      localStorage.removeItem("hora_llegada_obra");
      localStorage.removeItem("hora_salida_obra");
      navigate("/eleccionaic"); // Redirige al componente eleccionaic
    } catch (err) {
      alert("Error al guardar: " + err.message);
    }
  };

  // Función para obtener la hora actual en formato HH:MM
  const get_hora_actual = () => {
    const now = new Date();
    return now.toTimeString().slice(0,5);
  };

  // Filtrar lista de auxiliares según búsqueda
  const lista_filtrada = lista_nombres.filter(nombre =>
    nombre.toLowerCase().includes(busqueda_auxiliar.toLowerCase())
  );

  // Validación de remisión: todos los campos requeridos deben estar llenos
  const remision_completa = (
    remision_actual.remision.trim() !== "" &&
    remision_actual.hora_llegada.trim() !== "" &&
    remision_actual.hora_inicial.trim() !== "" &&
    remision_actual.hora_final.trim() !== "" &&
    remision_actual.metros.trim() !== "" &&
    !isNaN(Number(remision_actual.metros)) &&
    Number(remision_actual.metros) > 0
  );

  // Opciones para metros cúbicos (0.1 a 12.0)
  const opciones_metros = Array.from({ length: 120 }, (_, i) => ((i + 1) / 10).toFixed(1));
  // Opciones para horómetros (0 a 9999)
  const opciones_horometro = Array.from({ length: 10000 }, (_, i) => i.toString());
  // Opciones para galones de combustible (0 a 30)
  const opciones_galones = Array.from({ length: 31 }, (_, i) => i.toString());
  // Opciones para manguera
  const opciones_manguera = ["3", "4", "5"];

  return (
    <div className="app-container">
      <h2>Control de Bombeo</h2>
      <form>
        <div className="app-group">
          <label className="app-label">Nombre del Cliente</label>
          <input className="app-input" name="nombre_cliente" value={datos.nombre_cliente} onChange={handle_change} />
        </div>
        <div className="app-group">
          <label className="app-label">Nombre Proyecto</label>
          <input
            className="app-input"
            name="nombre_proyecto"
            value={datos.nombre_proyecto}
            onChange={handle_change}
            readOnly
          />
        </div>
        <div className="app-group" style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="app-label">Fecha Servicio</label>
            <input
              className="app-input"
              type="date"
              name="fecha_servicio"
              value={datos.fecha_servicio}
              onChange={handle_change}
              readOnly
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="app-label">Bomba #</label>
            <select
              className="app-input"
              name="bomba_numero"
              value={datos.bomba_numero}
              onChange={handle_change}
            >
              <option value="">Selecciona bomba</option>
              {lista_bombas.map((b, idx) => (
                <option key={idx} value={b.numero_bomba}>{b.numero_bomba}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="app-group" style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="app-label">Hora Llegada Obra</label>
            <div style={{ width: "100%" }}>
              <input
                className="app-input"
                type="time"
                name="hora_llegada_obra"
                value={datos.hora_llegada_obra}
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
                onClick={registrar_hora_llegada_obra}
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
                name="hora_salida_obra"
                value={datos.hora_salida_obra}
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
                onClick={registrar_hora_salida_obra}
              >
                Registrar hora
              </button>
            </div>
          </div>
        </div>
        {/* Remisiones */}
        <div className="app-group">
          <h3 style={{ color: "#1976d2", marginBottom: "12px" }}>
            Remisiones ({remisiones.length} guardadas)
          </h3>
          {remisiones.length === 0 && (
            <div style={{ color: "#888", marginBottom: "8px" }}>
              No has guardado ninguna remisión aún.
            </div>
          )}
          {remisiones.map((r, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "12px",
                padding: "10px",
                background: "#f5faff",
                borderRadius: "8px",
                border: "1px solid #e3eafc"
              }}
            >
              <div style={{ fontWeight: "bold", color: "#1976d2", marginBottom: 4 }}>
                Remisión {idx + 1}
              </div>
              <div><strong>N° Remisión:</strong> {r.remision}</div>
              <div><strong>Hora Llegada:</strong> {r.hora_llegada}</div>
              <div><strong>Hora Inicial:</strong> {r.hora_inicial}</div>
              <div><strong>Hora Final:</strong> {r.hora_final}</div>
              <div><strong>M³:</strong> {r.metros}</div>
              <div><strong>Observaciones:</strong> {r.observaciones}</div>
            </div>
          ))}
          <button
            type="button"
            className="app-button"
            style={{ maxWidth: 220, marginBottom: 8 }}
            onClick={abrir_modal_remision}
          >
            Agregar remisión
          </button>
        </div>
        <div className="app-group" style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="app-label">Galones de Inicio ACPM</label>
            <input
              className="app-input"
              name="galones_inicio_acpm"
              value={datos.galones_inicio_acpm}
              onChange={handle_galones_change}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="app-label">Galones de Final ACPM</label>
            <input
              className="app-input"
              name="galones_final_acpm"
              value={datos.galones_final_acpm}
              onChange={handle_galones_change}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
            />
          </div>
        </div>
        <div className="app-group">
          <label className="app-label">Galones Pinpina</label>
          <input
            className="app-input"
            name="galones_pinpina"
            value={datos.galones_pinpina}
            onChange={handle_galones_change}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
          />
        </div>
        <div className="app-group" style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="app-label">Horómetros Inicial</label>
            <input
              className="app-input"
              name="horometro_inicial"
              value={datos.horometro_inicial}
              onChange={handle_horometro_change}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="app-label">Horómetros Final</label>
            <input
              className="app-input"
              name="horometro_final"
              value={datos.horometro_final}
              onChange={handle_horometro_change}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
            />
          </div>
        </div>
        <div className="app-group">
          <label className="app-label">Nombre Operador</label>
          <input
            className="app-input"
            name="nombre_operador"
            value={datos.nombre_operador}
            readOnly
            tabIndex={-1}
          />
        </div>
        <div className="app-group">
          <label className="app-label">Nombre Auxiliar</label>
          <input
            className="app-input"
            list="lista_nombres_auxiliares"
            placeholder="Buscar o selecciona auxiliar"
            value={busqueda_auxiliar || datos.nombre_auxiliar}
            onChange={e => {
              set_busqueda_auxiliar(e.target.value);
              setDatos({ ...datos, nombre_auxiliar: e.target.value });
            }}
            autoComplete="off"
          />
          <datalist id="lista_nombres_auxiliares">
            {lista_nombres.map((nombre, idx) => (
              <option key={idx} value={nombre} />
            ))}
          </datalist>
        </div>
        <div className="app-group" style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="app-label">Total M³ Bombeados</label>
            <input className="app-input" name="total_metros_cubicos_bombeados" value={datos.total_metros_cubicos_bombeados} onChange={handle_change} />
          </div>
        </div>
        <div className="app-group">
          <label className="app-label">Aceptación Cliente - Nombre y Apellido</label>
          <input className="app-input" name="nombre_cliente_aceptacion" value={datos.nombre_cliente_aceptacion} onChange={handle_change} />
        </div>
        <div className="app-group">
          <label className="app-label">C.C.</label>
          <input className="app-input" name="cc_cliente_aceptacion" value={datos.cc_cliente_aceptacion} onChange={handle_change} />
        </div>
        <div className="app-group" style={{ marginTop: 16 }}>
          <button type="button" className="app-button" onClick={handle_guardar}>
            Guardar
          </button>
        </div>
      </form>
      {/* Modal para agregar remisión */}
      {modal_abierto && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.25)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div className="modal-remision">
            <h3 style={{ color: "#1976d2", textAlign: "center" }}>Agregar Remisión</h3>
            <label className="app-label">N° Remisión</label>
            <input
              className="app-input"
              name="remision"
              value={remision_actual.remision}
              readOnly
              tabIndex={-1}
              style={{ background: "#eee", color: "#1976d2", fontWeight: "bold" }}
            />
            
            <label className="app-label">Hora Llegada</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="app-input"
                type="time"
                name="hora_llegada"
                value={remision_actual.hora_llegada}
                onChange={handle_remision_change}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="app-button"
                style={{ flex: 1, minWidth: 0, padding: "10px 0", fontSize: 14 }}
                onClick={() => set_remision_actual({ ...remision_actual, hora_llegada: get_hora_actual() })}
              >
                Registrar hora
              </button>
            </div>

            <label className="app-label">Hora Inicial</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="app-input"
                type="time"
                name="hora_inicial"
                value={remision_actual.hora_inicial}
                onChange={handle_remision_change}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="app-button"
                style={{ flex: 1, minWidth: 0, padding: "10px 0", fontSize: 14 }}
                onClick={() => set_remision_actual({ ...remision_actual, hora_inicial: get_hora_actual() })}
              >
                Registrar hora
              </button>
            </div>

            <label className="app-label">Hora Final</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="app-input"
                type="time"
                name="hora_final"
                value={remision_actual.hora_final}
                onChange={handle_remision_change}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="app-button"
                style={{ flex: 1, minWidth: 0, padding: "10px 0", fontSize: 14 }}
                onClick={() => set_remision_actual({ ...remision_actual, hora_final: get_hora_actual() })}
              >
                Registrar hora
              </button>
            </div>

            <label className="app-label">Manguera</label>
            <select
              className="app-input"
              name="manguera"
              value={remision_actual.manguera}
              onChange={handle_remision_change}
            >
              {opciones_manguera.map((m, idx) => (
                <option key={idx} value={m}>{m}</option>
              ))}
            </select>

            <label className="app-label">M³</label>
            <input
              className="app-input"
              name="metros"
              value={remision_actual.metros}
              onChange={handle_metros_change}
              inputMode="decimal"
              pattern="[0-9.]*"
            />
            <label className="app-label">Observaciones</label>
            <input className="app-input" name="observaciones" value={remision_actual.observaciones} onChange={handle_remision_change} />
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button
                type="button"
                className="app-button"
                style={{ flex: 1 }}
                onClick={guardar_remision}
                disabled={!remision_completa}
                title={!remision_completa ? "Completa todos los campos obligatorios" : ""}
              >
                Guardar
              </button>
              <button
                type="button"
                className="app-button"
                style={{ flex: 1, background: "#eee", color: "#1976d2" }}
                onClick={() => set_modal_abierto(false)}
              >
                Cancelar
              </button>
            </div>
            {!remision_completa && (
              <div style={{ color: "red", marginTop: 8, textAlign: "center", fontSize: 13 }}>
                Completa todos los campos obligatorios y asegúrate que los metros sean un número mayor a 0.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default planillabombeo;


