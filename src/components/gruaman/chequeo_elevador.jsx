import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

// Usa variable de entorno para la base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

// Mapeo de las preguntas (items) a los nombres de las columnas de la DB
const MAPEO_DB = {
  // CONDICIONES DE SEGURIDAD
  "Cuenta con el Equipo de Protección Personal (guantes, casco con barbuquejo, tapaoídos, gafas con filtro UV, calzado de seguridad; la ropa de dotación).": "epp_completo_y_en_buen_estado",
  "Cuenta con el Equipo de Protección Contra Caídas (arnés de cuerpo completo, arrestador de caídas, mosquetones, eslinga en 'Y' con absorbedor, eslinga de posicionamiento, línea de vida, mecanismos de anclaje).": "epcc_completo_y_en_buen_estado",

  // EQUIPO DE ELEVACIÓN
  "Se ha verificado la estructura del equipo y se encuentra en buen estado?": "estructura_equipo_buen_estado",
  "El equipo presenta fugas de aceites, hidráulico o de alguna otra sustancia?": "equipo_sin_fugas_fluido",
  "El tablero de mando del equipo está en buenas condiciones?": "tablero_mando_buen_estado",
  "La puerta de acceso al equipo se encuentra en buen estado?": "puerta_acceso_buen_estado",
  "El gancho de seguridad de la cabina está en buen estado y se garantiza su correcto funcionamiento?": "gancho_seguridad_funciona_correctamente",
  "La plataforma se encuentra limpia y libre de sustancias deslizantes que puedan provocar la caída de personas u objetos?": "plataforma_limpia_y_sin_sustancias_deslizantes",
  "La cabina está libre de escombros y barro (orden y aseo).": "cabina_libre_de_escombros_y_aseada",
  "Los cables del circuito eléctrico y del motor se encuentran en buen estado (sin cables sueltos ni cortos)?": "cables_electricos_y_motor_buen_estado",
  "Los anclajes y/o arriostramientos se encuentran bien asegurados?": "anclajes_y_arriostramientos_bien_asegurados",
  "Las secciones del equipo se encuentran bien acopladas?": "secciones_equipo_bien_acopladas",
  "Los rodillos de guía se encuentran bien lubricados y en buen estado?": "rodillos_guia_buen_estado_y_lubricados",
  "Rieles de seguridad en el techo de la cabina están en buen estado?": "rieles_seguridad_techo_buen_estado",
  "Cuenta con la plataforma de trabajo encima de la cabina y ésta se encuentra en buen estado?": "plataforma_trabajo_techo_buen_estado",
  "La escalera de acceso al techo se encuentra en buen estado?": "escalera_acceso_techo_buen_estado",
  "El freno eléctrico-magnético se encuentra en buen estado?": "freno_electromagnetico_buen_estado",
  "El equipo cuenta con sistema de velocidad calibrado, dispositivo de reducción y piñones en buen estado y la cremallera de subida lubricada?": "sistema_velocidad_calibrado_y_engranes_buen_estado",
  "Los limitantes (superior e inferior) se encuentran calibrados y se garantiza el correcto funcionamiento?": "limitantes_superior_inferior_calibrados",

  // DISPOSITIVOS DE SEGURIDAD
  "El área del equipo se encuentra debidamente señalizada y demarcada?": "area_equipo_senalizada_y_demarcada",
  "El equipo de elevación cuenta con la parada de emergencia?": "equipo_con_parada_emergencia",
  "El equipo tiene la placa de identificación donde se muestra la carga máxima?": "placa_identificacion_con_carga_maxima",
  "Se garantiza el correcto funcionamiento del sistema de sobrecarga?": "sistema_sobrecarga_funcional",

  // PROCESO DE DESINFECCIÓN DE CABINA
  "La cabina ha sido previamente desinfectada antes de iniciar labores de operación de torre grúa (limpieza para la prevención del virus COVID-19)?": "cabina_desinfectada_previamente",
};

function getCurrentWeekKey() {
  const now = new Date();
  const firstJan = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - firstJan) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + firstJan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}
function isSunday() {
  return new Date().getDay() === 0;
}

function ChequeoElevador() {
  const navigate = useNavigate();

  // 🔑 DATOS GENERALES: Renombrados
  const [generales, setGenerales] = useState({
    nombre_cliente: "", // Antes: cliente_constructora
    nombre_proyecto: "", // Antes: proyecto_constructora
    fecha_servicio: "",
    nombre_operador: "",
    cargo: "", // Antes se mapeaba a cargo_operador, ahora es cargo
    observaciones: "", // Se mapea a observaciones_generales
  });

  // Estados
  const [respuestas, setRespuestas] = useState({});
  const [errores, setErrores] = useState([]);
  const [mostrarFlecha, setMostrarFlecha] = useState(false);
  const submitRef = useRef(null);
  const itemRefs = useRef({});

  // Secciones (sin cambios)
  const secciones = [
    {
      titulo: "CONDICIONES DE SEGURIDAD",
      items: [
        "Cuenta con el Equipo de Protección Personal (guantes, casco con barbuquejo, tapaoídos, gafas con filtro UV, calzado de seguridad; la ropa de dotación).",
        "Cuenta con el Equipo de Protección Contra Caídas (arnés de cuerpo completo, arrestador de caídas, mosquetones, eslinga en 'Y' con absorbedor, eslinga de posicionamiento, línea de vida, mecanismos de anclaje).",
      ],
    },
    {
      titulo: "EQUIPO DE ELEVACIÓN",
      items: [
        "Se ha verificado la estructura del equipo y se encuentra en buen estado?",
        "El equipo presenta fugas de aceites, hidráulico o de alguna otra sustancia?",
        "El tablero de mando del equipo está en buenas condiciones?",
        "La puerta de acceso al equipo se encuentra en buen estado?",
        "El gancho de seguridad de la cabina está en buen estado y se garantiza su correcto funcionamiento?",
        "La plataforma se encuentra limpia y libre de sustancias deslizantes que puedan provocar la caída de personas u objetos?",
        "La cabina está libre de escombros y barro (orden y aseo).",
        "Los cables del circuito eléctrico y del motor se encuentran en buen estado (sin cables sueltos ni cortos)?",
        "Los anclajes y/o arriostramientos se encuentran bien asegurados?",
        "Las secciones del equipo se encuentran bien acopladas?",
        "Los rodillos de guía se encuentran bien lubricados y en buen estado?",
        "Rieles de seguridad en el techo de la cabina están en buen estado?",
        "Cuenta con la plataforma de trabajo encima de la cabina y ésta se encuentra en buen estado?",
        "La escalera de acceso al techo se encuentra en buen estado?",
        "El freno eléctrico-magnético se encuentra en buen estado?",
        "El equipo cuenta con sistema de velocidad calibrado, dispositivo de reducción y piñones en buen estado y la cremallera de subida lubricada?",
        "Los limitantes (superior e inferior) se encuentran calibrados y se garantiza el correcto funcionamiento?",
      ],
    },
    {
      titulo: "DISPOSITIVOS DE SEGURIDAD",
      items: [
        "El área del equipo se encuentra debidamente señalizada y demarcada?",
        "El equipo de elevación cuenta con la parada de emergencia?",
        "El equipo tiene la placa de identificación donde se muestra la carga máxima?",
        "Se garantiza el correcto funcionamiento del sistema de sobrecarga?",
      ],
    },
    {
      titulo: "PROCESO DE DESINFECCIÓN DE CABINA",
      items: [
        "La cabina ha sido previamente desinfectada antes de iniciar labores de operación de torre grúa (limpieza para la prevención del virus COVID-19)?",
      ],
    },
  ];

  // La función makeKey ahora usará el mapeo a la columna de la DB (sin cambios)
  const makeKey = (itemText) => MAPEO_DB[itemText] || itemText; 

  useEffect(() => {
    const initial = {};
    secciones.forEach(sec =>
      sec.items.forEach(it => {
        const key = makeKey(it);
        initial[key] = "";
      })
    );
    setRespuestas(initial);
  }, []); // eslint-disable-line

  // --- NUEVO: Manejo de respuestas precargadas por semana ---
  useEffect(() => {
    const weekKey = getCurrentWeekKey();
    const saved = localStorage.getItem("chequeo_elevador_respuestas");
    let shouldClear = false;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isSunday() || parsed.weekKey !== weekKey) {
          shouldClear = true;
        } else {
          setRespuestas(parsed.respuestas || {});
          setGenerales(parsed.generales || {
            nombre_cliente: "",
            nombre_proyecto: "",
            fecha_servicio: "",
            nombre_operador: "",
            cargo: "",
            observaciones: "",
          });
        }
      } catch {
        shouldClear = true;
      }
    }
    if (shouldClear) {
      localStorage.removeItem("chequeo_elevador_respuestas");
      setRespuestas({});
      setGenerales({
        nombre_cliente: "",
        nombre_proyecto: "",
        fecha_servicio: "",
        nombre_operador: "",
        cargo: "",
        observaciones: "",
      });
    }
  }, []);
  // --- FIN NUEVO ---

  useEffect(() => {
    const init = async () => {
      const fechaHoy = new Date().toISOString().slice(0, 10);
      const nombre_operador =
        localStorage.getItem("nombre_trabajador") ||
        localStorage.getItem("usuario_nombre") ||
        "";
      const proyecto =
        localStorage.getItem("obra") ||
        localStorage.getItem("nombre_proyecto") ||
        "";
      let constructora = "";
      try {
        // Asumiendo que esta URL es correcta y funcional
        const res = await axios.get(`${API_BASE_URL}/obras`);
        const obras = Array.isArray(res.data.obras) ? res.data.obras : res.data || [];
        const obra_obj = obras.find(
          (o) => (o.nombre_obra || o.nombre || "") === proyecto
        );
        constructora = obra_obj ? obra_obj.constructora || obra_obj.empresa || "" : "";
      } catch (err) {
        console.error("Error obteniendo obras:", err?.response?.data || err.message);
      }

      const cargo = localStorage.getItem("cargo_trabajador") || "";

      // 🔑 ESTADO INICIAL: Renombrado de claves
      setGenerales({
        nombre_cliente: constructora, // Antes: cliente_constructora
        nombre_proyecto: proyecto, // Antes: proyecto_constructora
        fecha_servicio: fechaHoy,
        nombre_operador: nombre_operador,
        cargo: cargo,
        observaciones: "",
      });
    };
    init();
  }, []);

  // Handlers (sin cambios, solo usan las nuevas claves)
  const handleGeneralesChange = (e) =>
    setGenerales((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSelectChange = (key, val) => {
    setRespuestas((prev) => ({ ...prev, [key]: val }));
    setErrores((prev) => prev.filter((p) => p !== key));
  };

  // Scroll a primer error (actualizado para usar las nuevas claves)
  const scrollToFirstError = (errList) => {
    if (!errList || errList.length === 0) return;
    const first = errList[0];
    
    // Primero, intenta hacer scroll a un error de respuesta (select)
    if (first in itemRefs.current && itemRefs.current[first]) {
      itemRefs.current[first].scrollIntoView({ behavior: "smooth", block: "center" });
      itemRefs.current[first].focus?.();
      return;
    }
    
    // Si es un error de dato general, haz scroll al campo con el nuevo nombre
    if (["nombre_cliente", "nombre_proyecto", "fecha_servicio", "nombre_operador", "cargo"].includes(first)) {
        document.getElementById(`campo_${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        document.getElementById(`campo_${first}`)?.focus?.();
        return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Ir al botón guardar
  const scrollToGuardar = () => {
    submitRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMostrarFlecha(false);
    const faltantes = [];

    // Validar Datos Generales (usando las nuevas claves)
    ["nombre_cliente", "nombre_proyecto", "fecha_servicio", "nombre_operador", "cargo"].forEach(
      (g) => {
        if (!generales[g] || !generales[g].toString().trim()) faltantes.push(g);
      }
    );

    // Validar Respuestas SI/NO/NA
    Object.keys(respuestas).forEach((k) => {
      const v = respuestas[k];
      if (!["SI", "NO", "NA"].includes(v)) faltantes.push(k);
    });

    if (faltantes.length > 0) {
      setErrores(faltantes);
      setMostrarFlecha(true);
      scrollToFirstError(faltantes);
      return;
    }

    // --- NUEVO: Guardar respuestas en localStorage por semana ---
    const weekKey = getCurrentWeekKey();
    localStorage.setItem(
      "chequeo_elevador_respuestas",
      JSON.stringify({
        weekKey,
        respuestas,
        generales,
      })
    );
    // --- FIN NUEVO ---

    // 🔑 CONSTRUCCIÓN DEL PAYLOAD: Renombrado de claves
    const payload = {
      // DATOS GENERALES
      nombre_cliente: generales.nombre_cliente, // Antes: cliente_constructora
      nombre_proyecto: generales.nombre_proyecto, // Antes: proyecto_constructora
      fecha_servicio: generales.fecha_servicio, // Se mantiene
      nombre_operador: generales.nombre_operador,
      cargo: generales.cargo, // Antes: cargo_operador

      // RESPUESTAS
      ...respuestas,

      // OBSERVACIONES
      observaciones_generales: generales.observaciones, // Se mantiene el mapeo
    };

    try {
      await axios.post(`${API_BASE_URL}/gruaman/chequeo_elevador`, payload);
      alert("Chequeo de elevador enviado correctamente.");
      navigate(-1); // vuelve al componente anterior
    } catch (err) {
      console.error("Error enviando chequeo de elevador:", err?.response?.data || err.message, payload);
      alert("Error al enviar el chequeo. Revisa la consola para más detalles.");
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {/* Datos Generales */}
      <div className="card-section" style={{ marginBottom: 16 }}>
        <h3 className="card-title" style={{ marginBottom: 12 }}>
          Datos Generales
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {[
            // 🔑 RENDERIZADO: Cambiando los nombres de los campos y etiquetas
            { name: "nombre_cliente", label: "Cliente / Constructora" },
            { name: "nombre_proyecto", label: "Proyecto / Constructora" },
            { name: "fecha_servicio", label: "Fecha" },
            { name: "nombre_operador", label: "Trabajador autorizado" },
            { name: "cargo", label: "Cargo" },
          ].map((item) => (
            <div key={item.name} style={{ flex: 1, minWidth: 180 }}>
              <label className="permiso-trabajo-label">{item.label}</label>
              <input
                id={`campo_${item.name}`}
                type="text"
                name={item.name}
                // Usando corchetes para acceder al estado con la clave dinámica (nueva)
                value={generales[item.name]} 
                onChange={handleGeneralesChange}
                className={`permiso-trabajo-input${
                  errores.includes(item.name) ? " campo-error" : ""
                }`}
                readOnly={
                  item.name !== "cargo" && item.name !== "observaciones" // Solo cargo es editable de los datos autocompletados
                }
                style={
                  errores.includes(item.name)
                    ? { borderColor: "red", background: "#ffeaea" }
                    : {}
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Secciones (sin cambios) */}
      {secciones.map((sec, sidx) => (
        <div className="card-section" key={sidx} style={{ marginBottom: 16 }}>
          <h4 className="card-title">{sec.titulo}</h4>
          {sec.items.map((it, iidx) => {
            const key = makeKey(it); // Usa el nombre de la columna DB
            const isError = errores.includes(key);
            return (
              <div
                key={key}
                className="permiso-trabajo-item"
                ref={(el) => (itemRefs.current[key] = el)}
                style={{ marginBottom: 12, position: "relative" }}
              >
                <div className="permiso-trabajo-label" style={{ marginBottom: 6 }}>
                  {it}
                </div>
                <select
                  value={respuestas[key] || ""}
                  onChange={(e) => handleSelectChange(key, e.target.value)}
                  className={`permiso-trabajo-select${isError ? " campo-error" : ""}`}
                  style={
                    isError
                      ? { borderColor: "red", background: "#ffeaea", minWidth: 140 }
                      : { minWidth: 140 }
                  }
                >
                  <option value="">--</option>
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                  <option value="NA">NA</option>
                </select>

                {/* Flecha persistente */}
                {isError && mostrarFlecha && (
                  <div
                    onClick={scrollToGuardar}
                    style={{
                      position: "absolute",
                      right: -30,
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: 20,
                      color: "red",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                    title="Volver al botón Guardar"
                  >
                    ⬆️
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Observaciones */}
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h4 className="card-title">Observaciones</h4>
        <textarea
          name="observaciones"
          value={generales.observaciones}
          onChange={handleGeneralesChange}
          rows={4}
          className="permiso-trabajo-input"
          placeholder="Escribe aquí tus observaciones..."
          style={{ width: "93%", resize: "vertical" }}
        />
      </div>

      {/* Botón Guardar */}
      <div style={{ textAlign: "right", marginTop: 24 }} ref={submitRef}>
        <button
          type="submit"
          className="button"
          style={{ background: "#ff9800", color: "#fff" }}
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

export default ChequeoElevador;

