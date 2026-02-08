import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

// Usa variable de entorno para la base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

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
  { item: "GU3", desc: "EMPAQUE 3\" FLANCHE PLANO" },
  { item: "GF45", desc: "ABRAZADERA 4\" FLANCHE PLANO" },
  { item: "GU45", desc: "EMPAQUE 4\" FLANCHE PLANO" },
  { item: "GF55", desc: "ABRAZADERA 5\" FLANCHE PLANO" },
  { item: "GU55", desc: "EMPAQUE 5\" FLANCHE PLANO" },
  { item: "K000907858", desc: "ABRAZADERA ARRANQUE 5\" CIFA" },
  { item: "266782", desc: "ABRAZADERA ARRANQUE 6\" TURBOSOL" },
  { item: "DIABLO 5\"", desc: "ATRAPA DIABLOS" },
  { item: "CA55R1000.45", desc: "CODO 45º R=1000 DE 5\" FLANCHE PLANO" },
  { item: "CUMN55R275.45", desc: "CODO 45º R=275 DE 5\" FLANCHE PLANO" },
  { item: "CA55.R500.45.S4", desc: "CODO 45º R=500 DE 5\" FLANCHE PLANO" },
  { item: "CA55R250.45", desc: "CODO 45º R=250 DE 5\" FLANCHE PLANO" },
  { item: "CA55R1000.90", desc: "CODO 90º R=1000 DE 5\" FLANCHE PLANO" },
  { item: "CUMN55R275.90D", desc: "CODO 90º R=275 DE 5\" FLANCHE PLANO" },
  { item: "CA55.R500.90.S4", desc: "CODO 90º R=500 DE 5\" FLANCHE PLANO" },
  { item: "CA55R250.90", desc: "CODO 90º R=250 DE 5\" FLANCHE PLANO" },
  { item: "261905", desc: "CODO DE SALIDA DE 6\" TURBOSOL" },
  { item: "S000224965", desc: "CODO DE SALIDA DE 5\" CIFA" },
  { item: "", desc: "EMPAQUE PARA CODO DE SALIDA CIFA" },
  { item: "TG80.075.100002X325", desc: "MANGUERA DE 3\" X 10 MT" },
  { item: "MANCON3X8", desc: "MANGUERA DE 3\" X 8 MT" },
  { item: "MANCON3", desc: "MANGUERA DE 3\" X 6 MT" },
  { item: "TG80.100.10000", desc: "MANGUERA DE 4\" X 10 MT" },
  { item: "TG80.100.6000.2X45", desc: "MANGUERA DE 4\" X 6MT" },
  { item: "TG801256000FP", desc: "MANGUERA DE 5\" X 6MT" },
  { item: "MIPLE", desc: "MIPLE" },
  { item: "NA0000043", desc: "REDUCCION DE 4\" A 3\"" },
  { item: "CF230664", desc: "REDUCCION DE 5\" A 4\"" },
  { item: "261906", desc: "REDUCCION DE 6 A 5\" TURBOSOL" },
  { item: "VSM.BGU.55M", desc: "VALVULA GUILLOTINA MANUAL DN 5.5\"" },
  { item: "", desc: "EXTINTOR" },
  { item: "", desc: "BOTIQUIN" }
];

// Map for DB columns for accesorios (buena/mala)
const accesoriosDBMap = [
  { base: "bola_limpieza_tuberia_55_cifa", buena: "bola_limpieza_tuberia_55_cifa_buena", mala: "bola_limpieza_tuberia_55_cifa_mala" },
  { base: "jostick", buena: "jostick_buena", mala: "jostick_mala" },
  { base: "inyector_grasa", buena: "inyector_grasa_buena", mala: "inyector_grasa_mala" },
  { base: "caja_herramientas", buena: "caja_herramientas_buena", mala: "caja_herramientas_mala" },
  { base: "tubo_entrega_50cm_flanche_plano", buena: "tubo_entrega_50cm_flanche_plano_buena", mala: "tubo_entrega_50cm_flanche_plano_mala" },
  { base: "caneca_5_galones", buena: "caneca_5_galones_buena", mala: "caneca_5_galones_mala" },
  { base: "caneca_55_galones", buena: "caneca_55_galones_buena", mala: "caneca_55_galones_mala" },
  { base: "pimpinas_5_6_galones", buena: "pimpinas_5_6_galones_buena", mala: "pimpinas_5_6_galones_mala" },
  { base: "manguera_bicolor", buena: "manguera_bicolor_buena", mala: "manguera_bicolor_mala" },
  { base: "juego_llaves_x3_piezas", buena: "juego_llaves_x3_piezas_buena", mala: "juego_llaves_x3_piezas_mala" },
  { base: "pinza_picolor", buena: "pinza_picolor_buena", mala: "pinza_picolor_mala" },
  { base: "bristol_14mm", buena: "bristol_14mm_buena", mala: "bristol_14mm_mala" },
  { base: "bristol_12mm", buena: "bristol_12mm_buena", mala: "bristol_12mm_mala" },
  { base: "juego_llaves_bristol_x9", buena: "juego_llaves_bristol_x9_buena", mala: "juego_llaves_bristol_x9_mala" },
  { base: "cortafrio", buena: "cortafrio_buena", mala: "cortafrio_mala" },
  { base: "pinzas_punta", buena: "pinzas_punta_buena", mala: "pinzas_punta_mala" },
  { base: "llave_expansiva_15", buena: "llave_expansiva_15_buena", mala: "llave_expansiva_15_mala" },
  { base: "maseta", buena: "maseta_buena", mala: "maseta_mala" },
  { base: "tubo_para_abrazadera", buena: "tubo_para_abrazadera_buena", mala: "tubo_para_abrazadera_mala" }
];

// Map for DB columns for accesorios tuberia (buena/mala)
const accesoriosTuberiaDBMap = [
  { base: "llave_11", buena: "llave_11_buena", mala: "llave_11_mala" },
  { base: "llave_10", buena: "llave_10_buena", mala: "llave_10_mala" },
  { base: "llave_13", buena: "llave_13_buena", mala: "llave_13_mala" },
  { base: "llave_14", buena: "llave_14_buena", mala: "llave_14_mala" },
  { base: "llave_17", buena: "llave_17_buena", mala: "llave_17_mala" },
  { base: "llave_19", buena: "llave_19_buena", mala: "llave_19_mala" },
  { base: "llave_22", buena: "llave_22_buena", mala: "llave_22_mala" },
  { base: "llave_24", buena: "llave_24_buena", mala: "llave_24_mala" },
  { base: "llave_27", buena: "llave_27_buena", mala: "llave_27_mala" },
  { base: "llave_30", buena: "llave_30_buena", mala: "llave_30_mala" },
  { base: "llave_32", buena: "llave_32_buena", mala: "llave_32_mala" },
  { base: "destornillador_pala_65x125mm", buena: "destornillador_pala_65x125mm_buena", mala: "destornillador_pala_65x125mm_mala" },
  { base: "destornillador_pala_8x150mm", buena: "destornillador_pala_8x150mm_buena", mala: "destornillador_pala_8x150mm_mala" },
  { base: "destornillador_pala_55x125mm", buena: "destornillador_pala_55x125mm_buena", mala: "destornillador_pala_55x125mm_mala" },
  { base: "destornillador_estrella_ph3x150mm", buena: "destornillador_estrella_ph3x150mm_buena", mala: "destornillador_estrella_ph3x150mm_mala" },
  { base: "destornillador_estrella_ph2x100mm", buena: "destornillador_estrella_ph2x100mm_buena", mala: "destornillador_estrella_ph2x100mm_mala" },
  { base: "destornillador_estrella_ph3x75mm", buena: "destornillador_estrella_ph3x75mm_buena", mala: "destornillador_estrella_ph3x75mm_mala" },
  { base: "cunete_grasa_5_galones", buena: "cunete_grasa_5_galones_buena", mala: "cunete_grasa_5_galones_mala" }
];

// Map for DB columns for items tuberia (buena/mala)
// Las primeras 4 son bombas y solo tienen campo de seriales (sin buena/mala)
const itemsTuberiaDBMap = [
  { item: "P506", seriales: "bomba_pc506_seriales" },
  { item: "PC607", seriales: "bomba_pc607_seriales" },
  { item: "TB30", seriales: "bomba_tb30_seriales" },
  { item: "TB50", seriales: "bomba_tb50_seriales" },
  { item: "TU553000FE52", buena: "tubo_3mt_cantidad_buena", mala: "tubo_3mt_cantidad_mala" },
  { item: "TU552000", buena: "tubo_2mt_cantidad_buena", mala: "tubo_2mt_cantidad_mala" },
  { item: "TU551000", buena: "tubo_1mt_cantidad_buena", mala: "tubo_1mt_cantidad_mala" },
  { item: "GF3", buena: "abrazadera_3_cantidad_buena", mala: "abrazadera_3_cantidad_mala" },
  { item: "GU3", buena: "empaque_3_cantidad_buena", mala: "empaque_3_cantidad_mala" },
  { item: "GF45", buena: "abrazadera_4_cantidad_buena", mala: "abrazadera_4_cantidad_mala" },
  { item: "GU45", buena: "empaque_4_cantidad_buena", mala: "empaque_4_cantidad_mala" },
  { item: "GF55", buena: "abrazadera_5_cantidad_buena", mala: "abrazadera_5_cantidad_mala" },
  { item: "GU55", buena: "empaque_5_cantidad_buena", mala: "empaque_5_cantidad_mala" },
  { item: "K000907858", buena: "abrazadera_arranque_5_cifa_buena", mala: "abrazadera_arranque_5_cifa_mala" },
  { item: "266782", buena: "abrazadera_arranque_6_turbosol_buena", mala: "abrazadera_arranque_6_turbosol_mala" },
  { item: "DIABLO 5\"", buena: "atrapa_diablos_cantidad_buena", mala: "atrapa_diablos_cantidad_mala" },
  { item: "CA55R1000.45", buena: "codo_45_r1000_buena", mala: "codo_45_r1000_mala" },
  { item: "CUMN55R275.45", buena: "codo_45_r275_buena", mala: "codo_45_r275_mala" },
  { item: "CA55.R500.45.S4", buena: "codo_45_r500_buena", mala: "codo_45_r500_mala" },
  { item: "CA55R250.45", buena: "codo_45_r250_buena", mala: "codo_45_r250_mala" },
  { item: "CA55R1000.90", buena: "codo_90_r1000_buena", mala: "codo_90_r1000_mala" },
  { item: "CUMN55R275.90D", buena: "codo_90_r275_buena", mala: "codo_90_r275_mala" },
  { item: "CA55.R500.90.S4", buena: "codo_90_r500_buena", mala: "codo_90_r500_mala" },
  { item: "CA55R250.90", buena: "codo_90_r250_buena", mala: "codo_90_r250_mala" },
  { item: "261905", buena: "codo_salida_6_turbosol_buena", mala: "codo_salida_6_turbosol_mala" },
  { item: "S000224965", buena: "codo_salida_5_cifa_buena", mala: "codo_salida_5_cifa_mala" },
  { item: "", buena: "empaque_codo_salida_cifa_buena", mala: "empaque_codo_salida_cifa_mala" },
  { item: "TG80.075.100002X325", buena: "manguera_3x10_buena", mala: "manguera_3x10_mala" },
  { item: "MANCON3X8", buena: "manguera_3x8_buena", mala: "manguera_3x8_mala" },
  { item: "MANCON3", buena: "manguera_3x6_buena", mala: "manguera_3x6_mala" },
  { item: "TG80.100.10000", buena: "manguera_4x10_buena", mala: "manguera_4x10_mala" },
  { item: "TG80.100.6000.2X45", buena: "manguera_4x6_buena", mala: "manguera_4x6_mala" },
  { item: "TG801256000FP", buena: "manguera_5x6_buena", mala: "manguera_5x6_mala" },
  { item: "MIPLE", buena: "miple_cantidad_buena", mala: "miple_cantidad_mala" },
  { item: "NA0000043", buena: "reduccion_4_a_3_buena", mala: "reduccion_4_a_3_mala" },
  { item: "CF230664", buena: "reduccion_5_a_4_buena", mala: "reduccion_5_a_4_mala" },
  { item: "261906", buena: "reduccion_6_a_5_buena", mala: "reduccion_6_a_5_mala" },
  { item: "VSM.BGU.55M", buena: "valvula_guillotina_55_buena", mala: "valvula_guillotina_55_mala" },
  { item: "", buena: "extintor_buena", mala: "extintor_mala" },
  { item: "", buena: "botiquin_buena", mala: "botiquin_mala" }
];

const getAccesorioValue = (obj, idx, tipo) => obj[idx]?.[tipo] || "";

const getTuberiaValue = (obj, idx, tipo) => obj[idx]?.[tipo] || "";

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function isFirstDayOfMonth() {
  return new Date().getDate() === 1;
}

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
  const [bombasSeriales, setBombasSeriales] = useState({ 0: [""], 1: [""], 2: [""], 3: [""] }); // Arrays de seriales para las 4 bombas
  const [observaciones, setObservaciones] = useState("");
  const [errores, setErrores] = useState({});
  const [mostrarFlechaGuardar, setMostrarFlechaGuardar] = useState(false);
  const guardarBtnRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const nombre_proyecto = localStorage.getItem("obra") || localStorage.getItem("nombre_proyecto") || "";
    const nombre_operador = localStorage.getItem("nombre_trabajador") || "";
    const fechaHoy = new Date().toISOString().slice(0, 10);

    axios.get(`${API_BASE_URL}/obras`)
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

  // Precarga mensual de respuestas (no editable)
  useEffect(() => {
    const monthKey = getCurrentMonthKey();
    const saved = localStorage.getItem("bomberman_inventariosobra_respuestas");
    let shouldClear = false;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isFirstDayOfMonth() || parsed.monthKey !== monthKey) {
          shouldClear = true;
        } else {
          setGenerales(parsed.generales || {
            cliente: "",
            proyecto: "",
            fecha: "",
            nombre_operador: "",
            cargo: ""
          });
          setAccesoriosCant(parsed.accesoriosCant || {});
          setAccesoriosTuberiaCant(parsed.accesoriosTuberiaCant || {});
          setTuberiaEstado(parsed.tuberiaEstado || {});
          setBombasSeriales(parsed.bombasSeriales || { 0: [""], 1: [""], 2: [""], 3: [""] });
          setObservaciones(parsed.observaciones || "");
        }
      } catch {
        shouldClear = true;
      }
    }
    if (shouldClear) {
      localStorage.removeItem("bomberman_inventariosobra_respuestas");
      setGenerales({
        cliente: "",
        proyecto: "",
        fecha: "",
        nombre_operador: "",
        cargo: ""
      });
      setAccesoriosCant({});
      setAccesoriosTuberiaCant({});
      setTuberiaEstado({});
      setBombasSeriales({ 0: [""], 1: [""], 2: [""], 3: [""] });
      setObservaciones("");
    }
    // eslint-disable-next-line
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

  const handleAccesorioChange = (id, tipo, val) => {
    setAccesoriosCant(prev => ({
      ...prev,
      [id]: { ...prev[id], [tipo]: val }
    }));
    setErrores(prev => ({ ...prev, [`acc_${id}_${tipo}`]: false }));
  };

  const handleAccesorioTuberiaChange = (id, tipo, val) => {
    setAccesoriosTuberiaCant(prev => ({
      ...prev,
      [id]: { ...prev[id], [tipo]: val }
    }));
    setErrores(prev => ({ ...prev, [`acct_${id}_${tipo}`]: false }));
  };

  const handleTuberiaChange = (id, tipo, val) => {
    setTuberiaEstado(prev => ({
      ...prev,
      [id]: { ...prev[id], [tipo]: val }
    }));
    setErrores(prev => ({ ...prev, [`tub_${id}_${tipo}`]: false }));
  };

  // Handler para seriales de bombas (índices 0-3)
  const handleBombaSerialChange = (bombaIdx, serialIdx, val) => {
    setBombasSeriales(prev => {
      const newSeriales = [...(prev[bombaIdx] || [""])];
      newSeriales[serialIdx] = val;
      return { ...prev, [bombaIdx]: newSeriales };
    });
  };

  // Agregar nuevo campo de serial para una bomba
  const agregarSerial = (bombaIdx) => {
    setBombasSeriales(prev => {
      const newSeriales = [...(prev[bombaIdx] || []), ""];
      return { ...prev, [bombaIdx]: newSeriales };
    });
  };

  // Eliminar un serial de una bomba
  const eliminarSerial = (bombaIdx, serialIdx) => {
    setBombasSeriales(prev => {
      const newSeriales = [...(prev[bombaIdx] || [])];
      newSeriales.splice(serialIdx, 1);
      if (newSeriales.length === 0) newSeriales.push("");
      return { ...prev, [bombaIdx]: newSeriales };
    });
  };

  // Agrega esta función para la validación y navegación a campos incompletos
  const validarCamposObligatorios = () => {
    const erroresTemp = {};
    let primerError = null;

    // Accesorios (buena y mala)
    accesorios.forEach((a, idx) => {
      if (!accesoriosCant[idx]?.buena && accesoriosCant[idx]?.buena !== 0) {
        erroresTemp[`acc_${idx}_buena`] = true;
        if (!primerError) primerError = `acc_${idx}_buena`;
      }
      if (!accesoriosCant[idx]?.mala && accesoriosCant[idx]?.mala !== 0) {
        erroresTemp[`acc_${idx}_mala`] = true;
        if (!primerError) primerError = `acc_${idx}_mala`;
      }
    });

    // Accesorios Tubería (buena y mala)
    accesoriosTuberia.forEach((a, idx) => {
      if (!accesoriosTuberiaCant[idx]?.buena && accesoriosTuberiaCant[idx]?.buena !== 0) {
        erroresTemp[`acct_${idx}_buena`] = true;
        if (!primerError) primerError = `acct_${idx}_buena`;
      }
      if (!accesoriosTuberiaCant[idx]?.mala && accesoriosTuberiaCant[idx]?.mala !== 0) {
        erroresTemp[`acct_${idx}_mala`] = true;
        if (!primerError) primerError = `acct_${idx}_mala`;
      }
    });

    // Tubería (buena y mala) - excepto las 4 primeras que son bombas (solo seriales)
    itemsTuberia.forEach((i, idx) => {
      if (idx >= 4) { // Solo validar buena/mala para items que no son bombas
        if (!tuberiaEstado[idx]?.buena && tuberiaEstado[idx]?.buena !== 0) {
          erroresTemp[`tub_${idx}_buena`] = true;
          if (!primerError) primerError = `tub_${idx}_buena`;
        }
        if (!tuberiaEstado[idx]?.mala && tuberiaEstado[idx]?.mala !== 0) {
          erroresTemp[`tub_${idx}_mala`] = true;
          if (!primerError) primerError = `tub_${idx}_mala`;
        }
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
      nombre_cliente: generales.cliente,
      nombre_proyecto: generales.proyecto,
      fecha_servicio: generales.fecha,
      nombre_operador: generales.nombre_operador,
      cargo: generales.cargo,
      ...accesoriosDBMap.reduce((acc, map, idx) => {
        acc[map.buena] = parseInt(getAccesorioValue(accesoriosCant, idx, "buena")) || 0;
        acc[map.mala] = parseInt(getAccesorioValue(accesoriosCant, idx, "mala")) || 0;
        return acc;
      }, {}),
      ...accesoriosTuberiaDBMap.reduce((acc, map, idx) => {
        acc[map.buena] = parseInt(getAccesorioValue(accesoriosTuberiaCant, idx, "buena")) || 0;
        acc[map.mala] = parseInt(getAccesorioValue(accesoriosTuberiaCant, idx, "mala")) || 0;
        return acc;
      }, {}),
      ...itemsTuberiaDBMap.reduce((acc, map, idx) => {
        // Las primeras 4 son bombas: solo envían seriales
        if (idx < 4 && map.seriales) {
          const serialesArray = bombasSeriales[idx] || [""];
          acc[map.seriales] = serialesArray
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .join(", ");
        } else {
          // El resto envía buena/mala
          acc[map.buena] = parseInt(getTuberiaValue(tuberiaEstado, idx, "buena")) || 0;
          acc[map.mala] = parseInt(getTuberiaValue(tuberiaEstado, idx, "mala")) || 0;
        }
        return acc;
      }, {}),
      observaciones_generales: observaciones
    };

    // Guardar solo si no existe para este mes
    const monthKey = getCurrentMonthKey();
    if (!localStorage.getItem("bomberman_inventariosobra_respuestas")) {
      localStorage.setItem(
        "bomberman_inventariosobra_respuestas",
        JSON.stringify({
          monthKey,
          generales,
          accesoriosCant,
          accesoriosTuberiaCant,
          tuberiaEstado,
          bombasSeriales,
          observaciones,
        })
      );
    }

    // Depuración: muestra el payload en consola antes de enviar
    console.log("Payload enviado a backend:", payload);

    try {
      await axios.post(`${API_BASE_URL}/bomberman/inventariosobra`, payload);
      window.alert("Inventario guardado correctamente en backend.");
      setMostrarFlechaGuardar(false);
      navigate(-1);
    } catch (err) {
      // Muestra el error y el payload para depuración
      console.error("Error al guardar inventario:", err?.response?.data || err, payload);
      window.alert("Error al guardar inventario. Revisa la consola para detalles.");
    }
  };

  // En los inputs y selects, hacer que sean readonly/disabled si hay datos precargados de este mes
  const monthKey = getCurrentMonthKey();
  const saved = localStorage.getItem("bomberman_inventariosobra_respuestas");
  let isReadOnly = false;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.monthKey === monthKey) {
        isReadOnly = true;
      }
    } catch {}
  }

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
              readOnly={isReadOnly}
            />
          </div>
        </div>
      </div>

      <div className="card-section" style={{ marginBottom: 16 }}>
        <h3 className="card-title">Accesorios</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <div style={{ flex: 1 }}></div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "#222", fontSize: 15, marginBottom: 4 }}>Cantidad</span>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ fontWeight: 600, color: "#222", fontSize: 13, width: 55, textAlign: "center" }}>Buena</span>
                <span style={{ fontWeight: 600, color: "#222", fontSize: 13, width: 120, textAlign: "center" }}>Mala</span>
              </div>
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
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={accesoriosCant[idx]?.buena || ""}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    handleAccesorioChange(idx, "buena", val);
                  }}
                  className={`permiso-trabajo-input${errores[`acc_${idx}_buena`] ? " campo-error" : ""}`}
                  style={errores[`acc_${idx}_buena`] ? { width: 60, borderColor: "red", background: "#ffeaea" } : { width: 60 }}
                  readOnly={isReadOnly}
                  id={`acc_${idx}_buena`}
                />
                {errores[`acc_${idx}_buena`] && (
                  <span style={{ color: "red", fontSize: 11 }}>Obligatorio</span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={accesoriosCant[idx]?.mala || ""}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    handleAccesorioChange(idx, "mala", val);
                  }}
                  className={`permiso-trabajo-input${errores[`acc_${idx}_mala`] ? " campo-error" : ""}`}
                  style={errores[`acc_${idx}_mala`] ? { width: 60, borderColor: "red", background: "#ffeaea" } : { width: 60 }}
                  readOnly={isReadOnly}
                  id={`acc_${idx}_mala`}
                />
                {errores[`acc_${idx}_mala`] && (
                  <span style={{ color: "red", fontSize: 11 }}>Obligatorio</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-section" style={{ marginBottom: 16 }}>
        <h3 className="card-title">Accesorios Tubería</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <div style={{ flex: 1 }}></div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "#222", fontSize: 15, marginBottom: 4 }}>Cantidad</span>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ fontWeight: 600, color: "#222", fontSize: 13, width: 55, textAlign: "center" }}>Buena</span>
                <span style={{ fontWeight: 600, color: "#222", fontSize: 13, width: 120, textAlign: "center" }}>Mala</span>
              </div>
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
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={accesoriosTuberiaCant[idx]?.buena || ""}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    handleAccesorioTuberiaChange(idx, "buena", val);
                  }}
                  className={`permiso-trabajo-input${errores[`acct_${idx}_buena`] ? " campo-error" : ""}`}
                  style={errores[`acct_${idx}_buena`] ? { width: 60, borderColor: "red", background: "#ffeaea" } : { width: 60 }}
                  readOnly={isReadOnly}
                  id={`acct_${idx}_buena`}
                />
                {errores[`acct_${idx}_buena`] && (
                  <span style={{ color: "red", fontSize: 11 }}>Obligatorio</span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={accesoriosTuberiaCant[idx]?.mala || ""}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    handleAccesorioTuberiaChange(idx, "mala", val);
                  }}
                  className={`permiso-trabajo-input${errores[`acct_${idx}_mala`] ? " campo-error" : ""}`}
                  style={errores[`acct_${idx}_mala`] ? { width: 60, borderColor: "red", background: "#ffeaea" } : { width: 60 }}
                  readOnly={isReadOnly}
                  id={`acct_${idx}_mala`}
                />
                {errores[`acct_${idx}_mala`] && (
                  <span style={{ color: "red", fontSize: 11 }}>Obligatorio</span>
                )}
              </div>
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
              {/* Para las 4 bombas (idx 0-3): solo mostrar seriales */}
              {idx < 4 ? (
                <div style={{ marginTop: 4 }}>
                  <label className="label" style={{ fontSize: 13, color: "#222", fontWeight: 600, marginBottom: 6, display: "block" }}>
                    Seriales
                  </label>
                  {(bombasSeriales[idx] || [""]).map((serial, sIdx) => (
                    <div key={sIdx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <input
                        type="text"
                        className="permiso-trabajo-input"
                        style={{ flex: 1, height: 32, fontSize: 14 }}
                        placeholder={`Serial ${sIdx + 1}`}
                        value={serial}
                        onChange={e => handleBombaSerialChange(idx, sIdx, e.target.value)}
                        readOnly={isReadOnly}
                      />
                      {!isReadOnly && (bombasSeriales[idx] || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarSerial(idx, sIdx)}
                          style={{
                            background: "#e74c3c",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            width: 28,
                            height: 28,
                            cursor: "pointer",
                            fontSize: 16,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          −
                        </button>
                      )}
                    </div>
                  ))}
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => agregarSerial(idx)}
                      style={{
                        background: "#27ae60",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        marginTop: 4
                      }}
                    >
                      + Agregar serial
                    </button>
                  )}
                </div>
              ) : (
                /* Para el resto de items: mostrar buena/mala */
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
                    <label className="label" style={{ fontSize: 13, color: "#222", fontWeight: 600 }}>Buena</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={tuberiaEstado[idx]?.buena || ""}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        handleTuberiaChange(idx, "buena", val);
                      }}
                      className={`permiso-trabajo-input${errores[`tub_${idx}_buena`] ? " campo-error" : ""}`}
                      style={errores[`tub_${idx}_buena`] ? { width: 60, borderColor: "red", background: "#ffeaea" } : { width: 60 }}
                      readOnly={isReadOnly}
                      id={`tub_${idx}_buena`}
                    />
                    {errores[`tub_${idx}_buena`] && (
                      <span style={{ color: "red", fontSize: 11 }}>Obligatorio</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
                    <label className="label" style={{ fontSize: 13, color: "#222", fontWeight: 600 }}>Mala</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={tuberiaEstado[idx]?.mala || ""}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        handleTuberiaChange(idx, "mala", val);
                      }}
                      className={`permiso-trabajo-input${errores[`tub_${idx}_mala`] ? " campo-error" : ""}`}
                      style={errores[`tub_${idx}_mala`] ? { width: 60, borderColor: "red", background: "#ffeaea" } : { width: 60 }}
                      readOnly={isReadOnly}
                      id={`tub_${idx}_mala`}
                    />
                    {errores[`tub_${idx}_mala`] && (
                      <span style={{ color: "red", fontSize: 11 }}>Obligatorio</span>
                    )}
                  </div>
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
          readOnly={isReadOnly}
        />
      </div>

      <div style={{ textAlign: "right", marginTop: 18 }}>
        <button
          type="submit"
          className="button"
          style={{ background: "#ff9800", color: "#fff" }}
          ref={guardarBtnRef}
          disabled={isReadOnly}
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

export default inventariosobra;
