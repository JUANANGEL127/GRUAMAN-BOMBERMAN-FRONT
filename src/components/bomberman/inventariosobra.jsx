import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

const accesorios = [
  { desc: "BOLA DE LIMPIEZA PARA TUBERIA DE 5.5\" CIFA" },
  { desc: "JOSTICK" },
  { desc: "INYECTOR DE GRASA" },
  { desc: "CAJA CON HERRAMIENTAS" },
  { desc: "TUBO ENTREGA 50CM FLANCHE PLANO" },
  { desc: "CANECA DE 5 GALONES" },
  { desc: "CANECA DE 55 GALONES" },
  { desc: "PIMPINAS DE 5 O 6 GALONES" },
  { desc: "MANGUERA BICOLOR" },
  { desc: "JUEGO DE LLAVES X3 PIEZAS" },
  { desc: "PINZA PICOLORO" },
  { desc: "BRISTOL 14MM" },
  { desc: "BRISTOL 12MM" },
  { desc: "JUEGO DE LLAVES BRISTOL X 9 PIEZAS" },
  { desc: "CORTAFRIO" },
  { desc: "PINZAS DE PUNTA" },
  { desc: "LLAVE EXPANSIVA 15\"" },
  { desc: "MASETA" },
  { desc: "TUBO PARA ABRAZADERA" }
];

const accesoriosTuberia = [
  { desc: "LLAVE 11\"" },
  { desc: "LLAVE 10\"" },
  { desc: "LLAVE 13\"" },
  { desc: "LLAVE 14\"" },
  { desc: "LLAVE 17\"" },
  { desc: "LLAVE 19\"" },
  { desc: "LLAVE 22\"" },
  { desc: "LLAVE 24\"" },
  { desc: "LLAVE 27\"" },
  { desc: "LLAVE 30\"" },
  { desc: "LLAVE 32\"" },
  { desc: "DESTORNILLADOR DE PALA 6,5X125MM" },
  { desc: "DESTORNILLADOR DE PALA 8X150MM" },
  { desc: "DESTORNILLADOR DE PALA 5,5X125MM" },
  { desc: "DESTORNILLADOR DE ESTRELLA PH3X1500MM" },
  { desc: "DESTORNILLADOR DE ESTRELLA PH2X100MM" },
  { desc: "DESTORNILLADOR DE ESTRELLA PH3X75MM" },
  { desc: "CUÑETE DE GRASA 5 GALONES" }
];

const itemsTuberia = [
  { item: "P506", desc: "BOMBA DE CONCRETO PC506/309 CIFA" },
  { item: "PC607", desc: "BOMBA DE CONCRETO PC607/411 CIFA" },
  { item: "TB30", desc: "BOMBA DE CONCRETO TB30 TURBOSOL" },
  { item: "TB50", desc: "BOMBA DE CONCRETO TB50 TURBOSOL" },
  { item: "TU553000FE52", desc: "TUBO DE 3MT FLANCHE PLANO" },
  { item: "TU552000", desc: "TUBO DE 2MT FLANCHE PLANO" },
  { item: "TU551000", desc: "TUBO DE 1MT FLANCHE PLANO" },
  { item: "GF3", desc: "ABRAZADERA 3\" FLANCHE PLANO" },
  { item: "GU3", desc: "EMPAǪUE 3\" FLANCHE PLANO" },
  { item: "GF45", desc: "ABRAZADERA 4\" FLANCHE PLANO" },
  { item: "GU45", desc: "EMPAǪUE 4\" FLANCHE PLANO" },
  { item: "GF55", desc: "ABRAZADERA 5\" FLANCHE PLANO" },
  { item: "GU55", desc: "EMPAǪUE 5\" FLANCHE PLANO" },
  { item: "K000907858", desc: "ABRAZADERA ARRANǪUE 5\" CIFA" },
  { item: "266782", desc: "ABRAZADERA ARRANǪUE 6\" TURBOSOL" },
  { item: "DIABLO 5\"", desc: "ATRAPA DIABLOS" },
  { item: "CA55R1000.45", desc: "CODO 45º R=1000 DE 5\" FLANCHE PLANO" },
  { item: "CUMN55R275.45", desc: "CODO 45º R=275 DE 5\" FLANCHE PLANO" },
  { item: "CA55.R500.45.S4", desc: "CODO 45º R=500 DE 5\" FLANCHE PLANO" },
  { item: "CA55R250.45", desc: "CODO 45º R=250 DE 5\" FLANCHE PLANO" },
  { item: "CA55R1000.90", desc: "CODO G0º R=1000 DE 5\" FLANCHE PLANO" },
  { item: "CUMN55R275.90D", desc: "CODO G0º R=275 DE 5\" FLANCHE PLANO" },
  { item: "CA55.R500.90.S4", desc: "CODO G0º R=500 DE 5\" FLANCHE PLANO" },
  { item: "CA55R250.90", desc: "CODO G0º R=250 DE 5\" FLANCHE PLANO" },
  { item: "261905", desc: "CODO DE SALIDA DE 6\" TURBOSOL" },
  { item: "S000224965", desc: "CODO DE SALIDA DE 5\" CIFA" },
  { item: "", desc: "EMPAǪUE PARA CODO DE SALIDA CIFA" },
  { item: "TG80.075.100002X325", desc: "MANGUERA DE 3” X 10 MT" },
  { item: "MANCON3”X8", desc: "MANGUERA DE 3” X 8 MT" },
  { item: "MANCON3”", desc: "MANGUERA DE 3” X 6 MT" },
  { item: "TG80.100.10000", desc: "MANGUERA DE 4” X 10 MT" },
  { item: "TG80.100.6000.2X45", desc: "MANGUERA DE 4” X 6MT" },
  { item: "TG801256000FP", desc: "MANGUERA DE 5” X 6MT" },
  { item: "MIPLE", desc: "MIPLE" },
  { item: "NA0000043", desc: "REDUCCION DE 4\" A 3\"" },
  { item: "CF230664", desc: "REDUCCION DE 5\" A 4\"" },
  { item: "261906", desc: "REDUCCION DE 6 A 5\" TURBOSOL" },
  { item: "VSM.BGU.55M", desc: "VALVULA GUILLOTINA MANUAL DN 5.5”" },
  { item: "", desc: "EXTINTOR" },
  { item: "", desc: "BOTIǪUIN" }
];

// Map for DB columns for accesorios
const accesoriosDBMap = [
  "bola_limpieza_tuberia_55_cifa",
  "jostick",
  "inyector_grasa",
  "caja_herramientas", // <--- corregido aquí
  "tubo_entrega_50cm_flanche_plano",
  "caneca_5_galones",
  "caneca_55_galones",
  "pimpinas_5_6_galones",
  "manguera_bicolor",
  "juego_llaves_x3_piezas",
  "pinza_picolor",
  "bristol_14mm",
  "bristol_12mm",
  "juego_llaves_bristol_x9",
  "cortafrio",
  "pinzas_punta",
  "llave_expansiva_15",
  "maseta",
  "tubo_para_abrazadera"
];

// Map for DB columns for accesorios tuberia
const accesoriosTuberiaDBMap = [
  "llave_11",
  "llave_10",
  "llave_13",
  "llave_14",
  "llave_17",
  "llave_19",
  "llave_22",
  "llave_24",
  "llave_27",
  "llave_30",
  "llave_32",
  "destornillador_pala_65x125mm",
  "destornillador_pala_8x150mm",
  "destornillador_pala_55x125mm",
  "destornillador_estrella_ph3x150mm",
  "destornillador_estrella_ph2x100mm",
  "destornillador_estrella_ph3x75mm",
  "cunete_grasa_5_galones"
];

// Map for DB columns for items tuberia (estado/observacion)
const itemsTuberiaDBMap = [
  { item: "P506", estado: "bomba_concreto_pc506_309_cifa_estado", obs: "bomba_concreto_pc506_309_cifa_observacion" },
  { item: "PC607", estado: "bomba_concreto_pc607_411_cifa_estado", obs: "bomba_concreto_pc607_411_cifa_observacion" },
  { item: "TB30", estado: "bomba_concreto_tb30_turbosol_estado", obs: "bomba_concreto_tb30_turbosol_observacion" },
  { item: "TB50", estado: "bomba_concreto_tb50_turbosol_estado", obs: "bomba_concreto_tb50_turbosol_observacion" },
  { item: "TU553000FE52", estado: "tubo_3mt_flanche_plano_estado", obs: "tubo_3mt_flanche_plano_observacion" },
  { item: "TU552000", estado: "tubo_2mt_flanche_plano_estado", obs: "tubo_2mt_flanche_plano_observacion" },
  { item: "TU551000", estado: "tubo_1mt_flanche_plano_estado", obs: "tubo_1mt_flanche_plano_observacion" },
  { item: "GF3", estado: "abrazadera_3_pulg_flanche_plano_estado", obs: "abrazadera_3_pulg_flanche_plano_observacion" },
  { item: "GU3", estado: "empaque_3_pulg_flanche_plano_estado", obs: "empaque_3_pulg_flanche_plano_observacion" },
  { item: "GF45", estado: "abrazadera_4_pulg_flanche_plano_estado", obs: "abrazadera_4_pulg_flanche_plano_observacion" },
  { item: "GU45", estado: "empaque_4_pulg_flanche_plano_estado", obs: "empaque_4_pulg_flanche_plano_observacion" },
  { item: "GF55", estado: "abrazadera_5_pulg_flanche_plano_estado", obs: "abrazadera_5_pulg_flanche_plano_observacion" },
  { item: "GU55", estado: "empaque_5_pulg_flanche_plano_estado", obs: "empaque_5_pulg_flanche_plano_observacion" },
  { item: "CA55R1000.45", estado: "codo_45_r1000_5_pulg_flanche_estado", obs: "codo_45_r1000_5_pulg_flanche_observacion" },
  { item: "CA55.R500.90.S4", estado: "codo_90_r500_5_pulg_flanche_estado", obs: "codo_90_r500_5_pulg_flanche_observacion" },
  { item: "261905", estado: "codo_salida_6_pulg_turbosol_estado", obs: "codo_salida_6_pulg_turbosol_observacion" },
  { item: "TG80.075.100002X325", estado: "manguera_3_pulg_x10mt_estado", obs: "manguera_3_pulg_x10mt_observacion" },
  { item: "TG801256000FP", estado: "manguera_5_pulg_x6mt_estado", obs: "manguera_5_pulg_x6mt_observacion" },
  { item: "CF230664", estado: "reduccion_5_a_4_pulg_estado", obs: "reduccion_5_a_4_pulg_observacion" },
  { item: "VSM.BGU.55M", estado: "valvula_guillotina_55_estado", obs: "valvula_guillotina_55_observacion" },
  { item: "", estado: "extintor_estado", obs: "extintor_observacion" },
  { item: "", estado: "botiquin_estado", obs: "botiquin_observacion" }
];

const getAccesorioValue = (obj, idx) => obj[idx] || "";

const getTuberiaValue = (obj, idx) => obj[idx]?.estado || "";
const getTuberiaObs = (obj, idx) => obj[idx]?.observaciones || "";

function inventariosobra() {
  const [generales, setGenerales] = useState({
    cliente: "",
    proyecto: "",
    fecha: "",
    nombre_operador: "",
    cargo: ""
  });
  const [accesoriosCant, setAccesoriosCant] = useState({});
  const [accesoriosTuberiaCant, setAccesoriosTuberiaCant] = useState({});
  const [tuberiaEstado, setTuberiaEstado] = useState({});
  const [observaciones, setObservaciones] = useState("");
  const [errores, setErrores] = useState({});
  const [mostrarFlechaGuardar, setMostrarFlechaGuardar] = useState(false);
  const guardarBtnRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const nombre_proyecto = localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "";
    const nombre_operador = localStorage.getItem("nombre_trabajador") || "";
    const fechaHoy = new Date().toISOString().slice(0, 10);

    axios.get("http://localhost:3000/obras")
      .then(res => {
        let obras = [];
        if (Array.isArray(res.data.obras)) obras = res.data.obras;
        const obra = obras.find(o => o.nombre_obra === nombre_proyecto);
        const constructora = obra ? obra.constructora : "";
        setGenerales({
          cliente: constructora,
          proyecto: nombre_proyecto,
          fecha: fechaHoy,
          nombre_operador,
          cargo: localStorage.getItem("cargo_trabajador") || ""
        });
      })
      .catch(() => {
        setGenerales({
          cliente: "",
          proyecto: nombre_proyecto,
          fecha: fechaHoy,
          nombre_operador,
          cargo: localStorage.getItem("cargo_trabajador") || ""
        });
      });
  }, []);

  const scrollToItem = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus?.();
    }
  };

  const scrollToGuardar = () => {
    if (guardarBtnRef.current) {
      guardarBtnRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      guardarBtnRef.current.focus?.();
      setMostrarFlechaGuardar(false);
    }
  };

  const handleAccesorioChange = (id, val) => {
    setAccesoriosCant(prev => ({ ...prev, [id]: val }));
    setErrores(prev => ({ ...prev, [`acc_${id}`]: false }));
  };

  const handleAccesorioTuberiaChange = (id, val) => {
    setAccesoriosTuberiaCant(prev => ({ ...prev, [id]: val }));
    setErrores(prev => ({ ...prev, [`acct_${id}`]: false }));
  };

  const handleTuberiaEstadoChange = (id, field, val) => {
    setTuberiaEstado(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: val }
    }));
    setErrores(prev => ({ ...prev, [`tub_${id}`]: false }));
  };

  // Agrega esta función para la validación y navegación a campos incompletos
  const validarCamposObligatorios = () => {
    const erroresTemp = {};
    let primerError = null;

    // Accesorios
    accesorios.forEach((a, idx) => {
      if (!accesoriosCant[idx] || accesoriosCant[idx].toString().trim() === "") {
        erroresTemp[`acc_${idx}`] = true;
        if (!primerError) primerError = `acc_${idx}`;
      }
    });

    // Accesorios Tubería
    accesoriosTuberia.forEach((a, idx) => {
      if (!accesoriosTuberiaCant[idx] || accesoriosTuberiaCant[idx].toString().trim() === "") {
        erroresTemp[`acct_${idx}`] = true;
        if (!primerError) primerError = `acct_${idx}`;
      }
    });

    // Tubería
    itemsTuberia.forEach((i, idx) => {
      if (!tuberiaEstado[idx] || !tuberiaEstado[idx].estado) {
        erroresTemp[`tub_${idx}`] = true;
        if (!primerError) primerError = `tub_${idx}`;
      }
      if (tuberiaEstado[idx]?.estado === "mala" && (!tuberiaEstado[idx]?.observaciones || tuberiaEstado[idx]?.observaciones.trim() === "")) {
        erroresTemp[`tub_obs_${idx}`] = true;
        if (!primerError) primerError = `tub_obs_${idx}`;
      }
    });

    setErrores(erroresTemp);

    if (primerError) {
      setMostrarFlechaGuardar(true);
      scrollToItem(primerError);
      return false;
    }
    return true;
  };

  // Modifica handleSubmit para depurar el payload en caso de error 400
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarCamposObligatorios()) return;

    const payload = {
      cliente_constructora: generales.cliente,
      proyecto_constructora: generales.proyecto,
      fecha_registro: generales.fecha,
      nombre_operador: generales.nombre_operador,
      cargo_operador: generales.cargo,
      ...accesoriosDBMap.reduce((acc, col, idx) => {
        acc[col] = getAccesorioValue(accesoriosCant, idx) || 0;
        return acc;
      }, {}),
      ...accesoriosTuberiaDBMap.reduce((acc, col, idx) => {
        acc[col] = getAccesorioValue(accesoriosTuberiaCant, idx) || 0;
        return acc;
      }, {}),
      ...itemsTuberiaDBMap.reduce((acc, map, idx) => {
        acc[map.estado] = getTuberiaValue(tuberiaEstado, idx) ? getTuberiaValue(tuberiaEstado, idx).toUpperCase() : "BUENA";
        acc[map.obs] = getTuberiaObs(tuberiaEstado, idx) || "";
        return acc;
      }, {}),
      observaciones_generales: observaciones
    };

    // Depuración: muestra el payload en consola antes de enviar
    console.log("Payload enviado a backend:", payload);

    try {
      await axios.post("http://localhost:3000/bomberman/inventariosobra", payload);
      window.alert("Inventario guardado correctamente en localhost.");
      setMostrarFlechaGuardar(false);
      navigate(-1);
    } catch (err) {
      // Muestra el error y el payload para depuración
      console.error("Error al guardar inventario:", err?.response?.data || err, payload);
      window.alert("Error al guardar inventario. Revisa la consola para detalles.");
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="card-section" style={{ marginBottom: 16 }}>
        <h3 className="card-title">Datos Generales</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { name: "cliente", label: "Cliente / Constructora" },
            { name: "proyecto", label: "Proyecto / Constructora" },
            { name: "fecha", label: "Fecha", type: "date" },
            { name: "nombre_operador", label: "Trabajador autorizado" }
          ].map(item => (
            <div key={item.name} style={{ width: "93%" }}>
              <label className="label">{item.label}</label>
              <input
                type={item.type || "text"}
                name={item.name}
                value={generales[item.name]}
                readOnly
                className="permiso-trabajo-input"
                style={{ width: "100%" }}
              />
            </div>
          ))}
          <div style={{ width: "93%" }}>
            <label className="label">Cargo</label>
            <input
              type="text"
              name="cargo"
              value={generales.cargo}
              onChange={e => setGenerales(prev => ({ ...prev, cargo: e.target.value }))}
              className="permiso-trabajo-input"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>

      <div className="card-section" style={{ marginBottom: 16 }}>
        <h3 className="card-title">Accesorios</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <div style={{ flex: 1 }}></div>
            <div style={{ width: 120, textAlign: "center" }}>
              <span style={{ fontWeight: 700, color: "#222", fontSize: 15 }}>Cantidad</span>
            </div>
          </div>
          {accesorios.map((a, idx) => (
            <div
              key={a.desc}
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 10,
                marginBottom: 10,
                padding: "10px 12px",
                border: "1px solid #ececec",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                gap: 12
              }}
              id={`acc_${idx}`}
            >
              <div style={{ flex: 1 }}>
                <span className="permiso-trabajo-label">{a.desc}</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={accesoriosCant[idx] || ""}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  handleAccesorioChange(idx, val);
                }}
                className={`permiso-trabajo-input${errores[`acc_${idx}`] ? " campo-error" : ""}`}
                style={errores[`acc_${idx}`] ? { width: 70, borderColor: "red", background: "#ffeaea" } : { width: 70 }}
              />
              {mostrarFlechaGuardar && errores[`acc_${idx}`] && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span
                    style={{
                      marginLeft: 8,
                      cursor: "pointer",
                      fontSize: 18,
                      verticalAlign: "middle"
                    }}
                    onClick={scrollToGuardar}
                    title="Ir al botón Guardar"
                  >
                    &#8594;
                  </span>
                  <span style={{ color: "red", fontSize: 13 }}>
                    Obligatorio
                  </span>
                </div>
              )}
              {!mostrarFlechaGuardar && errores[`acc_${idx}`] && (
                <span style={{ color: "red", fontSize: 13 }}>
                  Obligatorio
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card-section" style={{ marginBottom: 16 }}>
        <h3 className="card-title">Accesorios Tubería</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <div style={{ flex: 1 }}></div>
            <div style={{ width: 120, textAlign: "center" }}>
              <span style={{ fontWeight: 700, color: "#222", fontSize: 15 }}>Cantidad</span>
            </div>
          </div>
          {accesoriosTuberia.map((a, idx) => (
            <div
              key={a.desc}
              style={{
                background: "rgba(255,255,255,0.15)",
                borderRadius: 10,
                marginBottom: 10,
                padding: "10px 12px",
                border: "1px solid #ececec",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                gap: 12
              }}
              id={`acct_${idx}`}
            >
              <div style={{ flex: 1 }}>
                <span className="permiso-trabajo-label">{a.desc}</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={accesoriosTuberiaCant[idx] || ""}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  handleAccesorioTuberiaChange(idx, val);
                }}
                className={`permiso-trabajo-input${errores[`acct_${idx}`] ? " campo-error" : ""}`}
                style={errores[`acct_${idx}`] ? { width: 70, borderColor: "red", background: "#ffeaea" } : { width: 70 }}
              />
              {mostrarFlechaGuardar && errores[`acct_${idx}`] && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span
                    style={{
                      marginLeft: 8,
                      cursor: "pointer",
                      fontSize: 18,
                      verticalAlign: "middle"
                    }}
                    onClick={scrollToGuardar}
                    title="Ir al botón Guardar"
                  >
                    &#8594;
                  </span>
                  <span style={{ color: "red", fontSize: 13 }}>
                    Obligatorio
                  </span>
                </div>
              )}
              {!mostrarFlechaGuardar && errores[`acct_${idx}`] && (
                <span style={{ color: "red", fontSize: 13 }}>
                  Obligatorio
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card-section" style={{ marginBottom: 16 }}>
        <h3 className="card-title">Inventario de Tubería y Accesorios</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {itemsTuberia.map((i, idx) => (
            <div
              key={i.item + i.desc}
              style={{
                background: "rgba(255,255,255,0.15)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                borderRadius: 14,
                marginBottom: 14,
                padding: "16px 14px",
                border: "1px solid #ececec",
                transition: "box-shadow 0.2s",
              }}
              id={`tub_${idx}`}
            >
              <div className="permiso-trabajo-label" style={{ fontWeight: 600, marginBottom: 6, fontSize: 17 }}>
                {i.item}
              </div>
              <div className="permiso-trabajo-label" style={{ marginBottom: 12, fontSize: 15, color: "#444" }}>
                {i.desc}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <div style={{ minWidth: 120 }}>
                  <label className="label" style={{ fontSize: 13 }}>Estado</label>
                  <select
                    value={tuberiaEstado[idx]?.estado || ""}
                    onChange={e => handleTuberiaEstadoChange(idx, "estado", e.target.value)}
                    className={`permiso-trabajo-select${errores[`tub_${idx}`] ? " campo-error" : ""}`}
                    style={errores[`tub_${idx}`] ? { width: 100, borderColor: "red", background: "#ffeaea" } : { width: 100, marginBottom: 6 }}
                    id={`tub_${idx}`}
                  >
                    <option value="">--</option>
                    <option value="buena">Buena</option>
                    <option value="mala">Mala</option>
                  </select>
                  {mostrarFlechaGuardar && errores[`tub_${idx}`] && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span
                        style={{
                          marginLeft: 8,
                          cursor: "pointer",
                          fontSize: 18,
                          verticalAlign: "middle"
                        }}
                        onClick={scrollToGuardar}
                        title="Ir al botón Guardar"
                      >
                        &#8594;
                      </span>
                      <span style={{ color: "red", fontSize: 13 }}>
                        Obligatorio
                      </span>
                    </div>
                  )}
                  {!mostrarFlechaGuardar && errores[`tub_${idx}`] && (
                    <span style={{ color: "red", fontSize: 13 }}>
                      Obligatorio
                    </span>
                  )}
                </div>
              </div>
              {tuberiaEstado[idx]?.estado === "mala" && (
                <div style={{ marginTop: 10 }}>
                  <label className="label" style={{ fontSize: 13 }}>Observaciones</label>
                  <input
                    type="text"
                    value={tuberiaEstado[idx]?.observaciones || ""}
                    onChange={e => handleTuberiaEstadoChange(idx, "observaciones", e.target.value)}
                    className={`permiso-trabajo-input${errores[`tub_obs_${idx}`] ? " campo-error" : ""}`}
                    style={errores[`tub_obs_${idx}`] ? { width: "93%", borderColor: "red", background: "#ffeaea", marginBottom: 6 } : { width: "93%", marginBottom: 6 }}
                    id={`tub_obs_${idx}`}
                  />
                  {mostrarFlechaGuardar && errores[`tub_obs_${idx}`] && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span
                        style={{
                          marginLeft: 8,
                          cursor: "pointer",
                          fontSize: 18,
                          verticalAlign: "middle"
                        }}
                        onClick={scrollToGuardar}
                        title="Ir al botón Guardar"
                      >
                        &#8594;
                      </span>
                      <span style={{ color: "red", fontSize: 13 }}>
                        Obligatorio
                      </span>
                    </div>
                  )}
                  {!mostrarFlechaGuardar && errores[`tub_obs_${idx}`] && (
                    <span style={{ color: "red", fontSize: 13 }}>
                      Obligatorio
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card-section">
        <label className="permiso-trabajo-label">OBSERVACIONES GENERALES</label>
        <textarea
          className="permiso-trabajo-textarea"
          style={{ width: "93%", minHeight: 80 }}
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
        />
      </div>

      <div style={{ textAlign: "right", marginTop: 18 }}>
        <button type="submit" className="button" style={{ background: "#ff9800", color: "#fff" }} ref={guardarBtnRef}>
          Guardar
        </button>
      </div>
    </form>
  );
}

export default inventariosobra;
