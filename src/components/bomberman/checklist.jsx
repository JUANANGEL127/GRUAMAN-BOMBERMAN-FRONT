import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/permiso_trabajo.css";

// Usa variable de entorno para la base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

function Checklist(props) { 
  const navigate = useNavigate();

  // 1. Referencias para campos obligatorios y el botón de guardar
  const [camposFaltantes, setCamposFaltantes] = useState([]);
  const itemRefs = useRef({});
  const submitRef = useRef(null);
  const bombaRef = useRef(null);
  const horometroRef = useRef(null);

  const [datos, setDatos] = useState({
    nombre_cliente: "",
    nombre_proyecto: "",
    fecha_servicio: "",
    bomba_numero: "",
    horometro_motor: "",
    nombre_operador: "",
    observaciones: "" 
  });

  const [lista_bombas, set_lista_bombas] = useState([]);
  const [estadoItems, setEstadoItems] = useState({}); 
  const [enviando, setEnviando] = useState(false);

  // ==================== NUEVOS ESTADOS PARA FIRMA ELECTRÓNICA ====================
  const [requiereFirma, setRequiereFirma] = useState(true);
  const [firmantePrincipal, setFirmantePrincipal] = useState({
    nombre: "",
    cedula: "",
    email: "",
    celular: ""
  });
  const [firmantesExternos, setFirmantesExternos] = useState([
    { nombre: "", cedula: "", email: "", celular: "" }
  ]);
  // ================================================================================

  const nombre_operador_local = localStorage.getItem("nombre_trabajador") || "";
  const nombre_obra_local = localStorage.getItem("obra") || "";

  // --- ARREGLO DE CLAVES DE LA BASE DE DATOS (itemToField) ---
  const itemToField = [
    // CHASIS (13 campos)
    "chasis_aceite_motor", "chasis_funcionamiento_combustible", "chasis_nivel_refrigerante",
    "chasis_nivel_aceite_hidraulicos", "chasis_presion_llantas", "chasis_fugas",
    "chasis_soldadura", "chasis_integridad_cubierta", "chasis_herramientas_productos_diversos",
    "chasis_sistema_alberca", "chasis_filtro_hidraulico", "chasis_filtro_agua_limpio",
    "chasis_nivel_agua",
    // PIEZAS DE DESGASTE Y SALIENTES (14 campos)
    "anillos", "anillos_desgaste", "placa_gafa", "cilindros_atornillados", "paso_masilla",
    "paso_agua", "partes_faltantes", "mecanismo_s", "funcion_sensor", "estado_oring",
    "funcion_vibrador", "paletas_eje_agitador", "motor_accionamiento", "valvula_control",
    // SISTEMA HIDRÁULICO (7 campos)
    "hidraulico_fugas", "hidraulico_cilindros_botellas_estado", "hidraulico_indicador_nivel_aceite",
    "hidraulico_enfriador_termotasto", "hidraulico_indicador_filtro", "hidraulico_limalla",
    "hidraulico_mangueras_tubos_sin_fugas",
    // SISTEMA LUBRICACION (4 campos)
    "superficie_nivel_deposito_grasa", "superficie_puntos_lubricacion", "superficie_empaquetaduras_conexion",
    "superficie_fugas", 
    // MANGUERAS Y ACOPLES (3 campos)
    "mangueras_interna_no_deshilachadas", "mangueras_acoples_buen_estado", "mangueras_externa_no_deshilachado",
    // SISTEMA ELÉCTRICO (8 campos)
    "electrico_interruptores_buen_estado", "electrico_luces_funcionan", "electrico_cubiertas_proteccion_buenas",
    "electrico_cordon_mando_buen_estado", "electrico_interruptores_emergencia_funcionan", "electrico_conexiones_sin_oxido",
    "electrico_paros_emergencia", "electrico_aisladores_cables_buenos",
    // TUBERÍA (6 campos)
    "tuberia_abrazaderas_codos_ajustadas", "tuberia_bujia_tallo_anclados", "tuberia_abrazaderas_descarga_ajustadas",
    "tuberia_espesor", "tuberia_vertical_tallo_recta", "tuberia_desplazamiento_seguro",
    // SST (19 campos)
    "equipo_limpio", "orden_aseo", "delimitacion_etiquetado", "permisos", "extintores", "botiquin",
    "arnes_eslinga", "dotacion", "epp", "rotulacion", "matriz_compatibilidad", "demarcacion_bomba",
    "orden_aseo_concreto", "epp_operario_auxiliar", "kit_mantenimiento", "combustible", "horas_motor",
    "grasa", "planillas"
  ];
  
  // --- MAPEO DE CLAVE DB a TEXTO VISIBLE (fieldToTextMap) ---
  const fieldToTextMap = {
    // CHASIS
    "chasis_aceite_motor": "Revisar el nivel de aceite del motor.",
    "chasis_funcionamiento_combustible": "Revise el nivel del tanque de combustible.",
    "chasis_nivel_refrigerante": "Revise el nivel del refrigerante.",
    "chasis_nivel_aceite_hidraulicos": "Revise el nivel del aceite de la hidrolavadora",
    "chasis_presion_llantas": "Revise la condición y la presión de las llantas.",
    "chasis_fugas": "Revise las fugas de combustible, aceite y otras fugas.",
    "chasis_soldadura": "Revise el sub-chasis para detectar grietas de soldadura, pernos faltantes, deformaciones.",
    "chasis_integridad_cubierta": "Revise la integridad estructural de la cubierta.",
    "chasis_herramientas_productos_diversos": "Revise que las cajas de herramientas y productos diversos estén aseguradas.",
    "chasis_sistema_alberca": "Revise sistema de drenaje de la alberca.",
    "chasis_filtro_hidraulico": "Revisión del filtro hidraúlico del equipo.",
    "chasis_filtro_agua_limpio": "Revisión del filtro del agua debe encontrarse limpio.",
    "chasis_nivel_agua": "Revisar el nivel del agua que se encuentre lleno.",
    // PIEZAS DE DESGASTE Y SALIENTES
    "anillos": "Revise anillo de corte y anillo de sujeción.",
    "anillos_desgaste": "Revise que el anillo de corte no presente desgaste prematuro",
    "placa_gafa": "Revise placa gafa.",
    "cilindros_atornillados": "Revisar que los cilindros de empuje o camisas de concreto estén asegurados y bien atornillados.",
    "paso_masilla": "Revise los pistones y asegure que no exista paso de masilla para la caja de refrigeración.",
    "paso_agua": "Revise los pistones y asegure que no exista paso de agua a la tolva.",
    "partes_faltantes": "Revisar si hay partes faltantes tales como pasadores, pernos y tuercas.",
    "mecanismo_s": "Revise que el mecanismo de cambio del tubo en \"S\" sea estructuralmente rígido.",
    "funcion_sensor": "Revisar que la rejilla de la tolva no este partida y que este funcionando el sensor.",
    "estado_oring": "Revise el estado del oring de la escotilla.",
    "funcion_vibrador": "Revisar que el vibrador esté montado en forma segura y que las conexiones de los cables estén aseguradas y este funcionando correctamente.",
    "paletas_eje_agitador": "Revise que las paletas y el eje del agitador no estén dañados y revise si hay soldaduras agrietadas.",
    "motor_accionamiento": "Revise si el motor de accionamiento está asegurado y si los cojinetes, sellos y caja están en buenas condiciones.",
    "valvula_control": "Revise que la válvula de control esté montada en forma segura y que las palancas se muevan libremente.",
    // SISTEMA HIDRÁULICO
    "hidraulico_fugas": "Revisar que no existan fugas hidraulicas, estrangule la maquina antes de inciar el servicio.",
    "hidraulico_cilindros_botellas_estado": "Revisar si los cilindros hidráulicos o botellas impulsadoras esten asegurados y en buenas condiciones.",
    "hidraulico_indicador_nivel_aceite": "Revise que el indicador visible de nivel aceite hidraulico esté en buenas condiciones.",
    "hidraulico_enfriador_termotasto": "Revise enfriador aceite hidraulico y su termostato.",
    "hidraulico_indicador_filtro": "Revisar los indicadores de la condición del filtro hidráulico.",
    "hidraulico_limalla": "Revisar que el filtro hidraulico no tenga limalla",
    "hidraulico_mangueras_tubos_sin_fugas": "Revise que las mangueras y tubos estén asegurados, sin fugas y que tengan un mínimo desgaste.",
    // SISTEMA LUBRICACION
    "superficie_nivel_deposito_grasa": "Revise el nivel del depósito de grasa.",
    "superficie_puntos_lubricacion": "Revise puntos de lubricación  (yugos, checks de distribución, ductos, mangueras distribución de grasa,  tarro general de autoengrase, arbol trasero.)",
    "superficie_empaquetaduras_conexion": "Revise si las empaquetaduras de  conexión del tubo en \"S\" en los sellos de salida y cojinetes se encuentran lubricadas.",
    "superficie_fugas": "Revise el nivel de agua de caja de lubricación de los pistones.",
    // MANGUERAS Y ACOPLES
    "mangueras_interna_no_deshilachadas": "Revisión interna que la manguera no se encuentre deshilachada.",
    "mangueras_acoples_buen_estado": "Revisión de acoples que se encuentren en buen estado.",
    "mangueras_externa_no_deshilachado": "Revisión externa de que la manguera no este deshilachada.",
    // SISTEMA ELÉCTRICO
    "electrico_interruptores_buen_estado": "Revisar que los interruptores estén en buenas condiciones, permanezcan en su posición o regresen momentáneamente al centro.",
    "electrico_luces_funcionan": "Revisar que los instrumentos e indicadores estén en buenas condiciones y que las luces funcionen.",
    "electrico_cubiertas_proteccion_buenas": "Revisar que las cubiertas de caucho de protección estén en buenas condiciones.",
    "electrico_cordon_mando_buen_estado": "Revisar que el cordón  de mando estén en buenas condiciones, que no esté dañado ni cortado, y que esté conectado en forma segura.",
    "electrico_interruptores_emergencia_funcionan": "Revise que los interruptores no estén dañados y revise las funciones de presionar/tirar de los interruptores de parada de emergencia.",
    "electrico_conexiones_sin_oxido": "Revisar que las conexiones eléctricas estén bien aseguradas y libres de óxido.",
    "electrico_paros_emergencia": "Revisar paros de emergencia.",
    "electrico_aisladores_cables_buenos": "Revisar que los aisladores de los cables no estén desgastados ni descascarados.",
    // TUBERÍA
    "tuberia_abrazaderas_codos_ajustadas": "Revisar que el codo de salida esté asegurado y que la abrazadera esté fija.",
    "tuberia_bujia_tallo_anclados": "Colocación de tubería y tallo (bien anclada a la estructura).",
    "tuberia_abrazaderas_descarga_ajustadas": "Revise si las abrazaderas de los tubos de descarga están flojas o dañadas.",
    "tuberia_espesor": "Revise espesores de tubería.",
    "tuberia_vertical_tallo_recta": "Revise que la vertical o tallo se encuentre recta.",
    "tuberia_desplazamiento_seguro": "Revisar el area de desplazamiento de la tuberia y que sea segura para su manipulacion y descargue Operador y auxiliar.",
    // SST
    "equipo_limpio": "El equipo debe estar completamente limpio, sin excesos de grasa antigua, ni concreto en partes como vibrador, parrilla y tolva, abrazaderas, empaques, tubería y mangueras.",
    "orden_aseo": "Revisión orden y aseo",
    "delimitacion_etiquetado": "Revisión delimitación area y etiquetado productos",
    "permisos": "Revisar permisos de trabajo y ATS y dejar firmados según la periodicidad que corresponda.",
    "extintores": "Revisión fecha de vencimiento extintores y marcación visible.",
    "botiquin": "Revisión elementos del botiquin (stock y fechas de vencimiento).",
    "arnes_eslinga": "Revisar que se encuentre vigente fecha de recertificación de arnes y eslinga, revisar que ambos se encuentren en buen estado y limpios.",
    "dotacion": "Revisar estado de dotación (camisa, pantalon, botas)",
    "epp": "Revisar estado de EPP (Casco, gafas, tapaoidos, tapabocas, barbuquejo, guantes)",
    "rotulacion": "Rotulación obligatoria de ACPM, GRASA LITIO y de AGUA NO POTABLE.",
    "matriz_compatibilidad": "Matriz de compatibilidad de ACPM y GRASA.",
    "demarcacion_bomba": "Demarcación del área donde se encuentra la bomba.",
    "orden_aseo_concreto": "Orden y aseo (bomba y alrededor libre de concreto)",
    "epp_operario_auxiliar": "Revise que el operario y ayudante porte: (Casco, Guantes, Tapa oidos, Barbuquejo, Botas, Uniforme de la empresa)",
    "kit_mantenimiento": "Revise kit de mantenimiento y herramientas y verificar con administración.",
    "combustible": "Revisión cantidad de combustble y stock verificar con administración.",
    "horas_motor": "Revisión horas de motor y verificar con administración para mantenimiento.",
    "grasa": "Revisar grasa y verificar con administración.",
    "planillas": "Revise planillas para confirmar horas trabajadas, metros cubicos bombeados, formato diligenciado total."
  };

  // --- ESTRUCTURA DE SECCIONES PARA EL RENDERIZADO ---
  const seccionesEstructura = [
    { titulo: "CHASIS", fields: itemToField.slice(0, 13) },
    { titulo: "PIEZAS DE DESGASTE Y SALIENTES", fields: itemToField.slice(13, 27) },
    { titulo: "SISTEMA HIDRÁULICO", fields: itemToField.slice(27, 34) },
    { titulo: "SISTEMA DE LUBRICACIÓN", fields: itemToField.slice(34, 38) },
    { titulo: "MANGUERAS (3\", 4\", 5\")", fields: itemToField.slice(38, 41) },
    { titulo: "SISTEMA ELÉCTRICO", fields: itemToField.slice(41, 49) },
    { titulo: "TUBERÍA", fields: itemToField.slice(49, 55) },
    { titulo: "SEGURIDAD Y SALUD EN EL TRABAJO (SST)", fields: itemToField.slice(55) },
  ];

  // --- FUNCIONES AUXILIARES ---
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

  // --- EFECTOS (Inicialización y carga de datos) ---
  useEffect(() => {
    const inicial = itemToField.reduce((acc, field) => {
      acc[field] = { estado: "", observacion: "" };
      return acc;
    }, {});
    setEstadoItems(inicial);
  }, []);

  useEffect(() => {
    const fecha_hoy = new Date().toISOString().slice(0, 10);
    axios
      .get(`${API_BASE_URL}/obras`)
      .then((res) => {
        const obras = Array.isArray(res.data.obras) ? res.data.obras : res.data || [];
        const obra_encontrada = obras.find((o) => o.nombre_obra === nombre_obra_local);
        const constructora = obra_encontrada ? obra_encontrada.constructora : "";
        setDatos((prev) => ({
          ...prev,
          nombre_cliente: constructora,
          nombre_proyecto: nombre_obra_local,
          fecha_servicio: fecha_hoy,
          nombre_operador: nombre_operador_local,
        }));
        
        // ==================== AUTO-RELLENAR FIRMANTE PRINCIPAL ====================
        // Usar el nombre del operador como firmante principal por defecto
        setFirmantePrincipal(prev => ({
          ...prev,
          nombre: nombre_operador_local
        }));
        // =========================================================================
      })
      .catch(() => {
        setDatos((prev) => ({
          ...prev,
          nombre_cliente: "",
          nombre_proyecto: nombre_obra_local,
          fecha_servicio: fecha_hoy,
          nombre_operador: nombre_operador_local,
        }));
      });
  }, [nombre_operador_local, nombre_obra_local]);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/bombas`)
      .then((res) => {
        const bombas = Array.isArray(res.data.bombas) ? res.data.bombas : res.data || [];
        set_lista_bombas(bombas);
      })
      .catch(() => set_lista_bombas([]));
  }, []);

  useEffect(() => {
    const weekKey = getCurrentWeekKey();
    const saved = localStorage.getItem("bomberman_checklist_respuestas");
    let shouldClear = false;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (isSunday() || parsed.weekKey !== weekKey) {
          shouldClear = true;
        } else {
          setDatos(parsed.datos || {
            nombre_cliente: "",
            nombre_proyecto: "",
            fecha_servicio: "",
            bomba_numero: "",
            horometro_motor: "",
            nombre_operador: "",
            observaciones: ""
          });
          setEstadoItems(parsed.estadoItems || {});
        }
      } catch {
        shouldClear = true;
      }
    }
    if (shouldClear) {
      localStorage.removeItem("bomberman_checklist_respuestas");
      setDatos({
        nombre_cliente: "",
        nombre_proyecto: "",
        fecha_servicio: "",
        bomba_numero: "",
        horometro_motor: "",
        nombre_operador: "",
        observaciones: ""
      });
      setEstadoItems(itemToField.reduce((acc, field) => {
        acc[field] = { estado: "", observacion: "" };
        return acc;
      }, {}));
    }
    // eslint-disable-next-line
  }, []);

  // --- HANDLERS ---
  const handle_change = (e) => {
    const { name, value } = e.target;
    if (name === "bomba_numero" || name === "horometro_motor") {
        setCamposFaltantes(prev => prev.filter(field => field !== name));
    }
    setDatos((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemStateChange = (fieldName, nuevoEstado) => {
    setCamposFaltantes(prev => prev.filter(field => field !== fieldName));
    
    setEstadoItems((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        estado: nuevoEstado,
        observacion: (nuevoEstado === 'BUENO' || nuevoEstado === '') 
            ? '' 
            : prev[fieldName].observacion,
      },
    }));
  };

  const handleItemObservationChange = (fieldName, nuevaObservacion) => {
    setCamposFaltantes(prev => prev.filter(field => field !== `${fieldName}_observacion`));
    
    setEstadoItems((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        observacion: nuevaObservacion,
      },
    }));
  };

  // ==================== HANDLERS PARA FIRMANTES ====================
  const handleFirmantePrincipalChange = (campo, valor) => {
    setFirmantePrincipal(prev => ({ ...prev, [campo]: valor }));
  };

  const handleFirmanteExternoChange = (index, campo, valor) => {
    const nuevos = [...firmantesExternos];
    nuevos[index][campo] = valor;
    setFirmantesExternos(nuevos);
  };

  const agregarFirmanteExterno = () => {
    setFirmantesExternos(prev => [...prev, { nombre: "", cedula: "", email: "", celular: "" }]);
  };

  const eliminarFirmanteExterno = (index) => {
    if (firmantesExternos.length > 1) {
      setFirmantesExternos(prev => prev.filter((_, i) => i !== index));
    }
  };
  // ==================================================================
  
  const scrollToFirstError = (errores) => {
    if (errores.length === 0) return;
    
    const primerError = errores[0];
    let elemento = null;

    if (primerError === 'bomba_numero') {
        elemento = bombaRef.current;
    } else if (primerError === 'horometro_motor') {
        elemento = horometroRef.current;
    } else {
        elemento = itemRefs.current[primerError];
    }
    
    if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
        elemento.focus?.();
    }
  };
  
  const scrollToBottom = () => {
    if (submitRef.current) {
        submitRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        submitRef.current.focus?.();
    }
  };

  // --- SUBMIT MODIFICADO CON FIRMA ELECTRÓNICA ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setCamposFaltantes([]);

    const erroresDetectados = [];
    const headerErrores = [];
    
    // 1. Validación de campos obligatorios del ENCABEZADO
    if (!datos.bomba_numero) headerErrores.push("bomba_numero");
    if (!datos.horometro_motor) headerErrores.push("horometro_motor");

    // 2. Validación de campos del CHECKLIST (Estado NOT NULL)
    itemToField.forEach(field => {
        if (estadoItems[field].estado === "") {
            erroresDetectados.push(field);
        }
    });

    // 3. Validación de campos de OBSERVACIÓN (Obligatorias si es REGULAR/MALO)
    itemToField.forEach(field => {
        if ((estadoItems[field].estado === 'REGULAR' || estadoItems[field].estado === 'MALO') && 
            estadoItems[field].observacion.trim() === "") {
            erroresDetectados.push(`${field}_observacion`);
        }
    });

    // ==================== VALIDACIÓN DE FIRMANTES ====================
    if (requiereFirma) {
      if (!firmantePrincipal.nombre || !firmantePrincipal.cedula || !firmantePrincipal.email) {
        headerErrores.push("firmante_principal");
      }
      // Validar firmantes externos que tengan algún dato
      firmantesExternos.forEach((f, idx) => {
        if (f.nombre || f.cedula || f.email) {
          if (!f.nombre || !f.cedula || !f.email) {
            headerErrores.push(`firmante_externo_${idx}`);
          }
        }
      });
    }
    // ==================================================================

    const totalErrores = headerErrores.length + erroresDetectados.length;
    
    if (totalErrores > 0) {
        const todosLosErrores = [...headerErrores, ...erroresDetectados];
        console.log(`Error: Se encontraron ${totalErrores} campos sin diligenciar.`);
        setCamposFaltantes(todosLosErrores);
        setEnviando(false);
        scrollToFirstError(todosLosErrores);
        return;
    }
    
    // --- PREPARAR PAYLOAD ---
    const checklistPayload = itemToField.reduce((acc, field) => {
        acc[field] = estadoItems[field].estado; 
        acc[`${field}_observacion`] = estadoItems[field].observacion.trim(); 
        return acc;
    }, {});

    // ==================== AGREGAR DATOS DE FIRMA AL PAYLOAD ====================
    const firmantesExternosValidos = firmantesExternos.filter(
      f => f.nombre && f.cedula && f.email
    );

    const payload = {
      ...datos, 
      ...checklistPayload,
      // Datos de firma electrónica
      requiere_firma: true,
      firmante_principal: firmantePrincipal,
      firmantes_externos: firmantesExternosValidos
    };
    // ===========================================================================
    
    // 5. Envío
    try {
      const response = await axios.post(`${API_BASE_URL}/bomberman/checklist`, payload);
      const resultado = response.data;
      
      console.log("Checklist enviado correctamente:", resultado);

      // ==================== MANEJAR RESPUESTA DE FIRMA ====================
      if (resultado.firma && resultado.firma.success) {
        // Redirigir directamente a la página de firma
        window.location.href = resultado.firma.url_firma;
      } else if (resultado.firma && !resultado.firma.success) {
        alert(`⚠️ Checklist guardado, pero hubo un error con la firma: ${resultado.firma.error}`);
        navigate(-1);
      } else {
        // Sin firma requerida
        alert("✅ Checklist guardado correctamente."); 
        navigate(-1); 
      }
      // ====================================================================
      
    } catch (err) {
      console.error("Error al enviar el checklist:", err.response ? err.response.data : err.message);
      alert("Error al guardar el checklist."); 
    } finally {
      setEnviando(false);
    }
  };

  // --- RENDERIZADO ---
  return (
    <form className="form-container" onSubmit={handleSubmit}>
          {/* 1. Datos Generales (ENCABEZADO) */}
          <div className="card-section" style={{ marginBottom: 16 }}>
            <h3 className="card-title" style={{ marginBottom: 12 }}>
              LISTA DE CHEQUEO PARA BOMBA ESTACIONARIA DE CONCRETO
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {[
                { name: "nombre_cliente", label: "Cliente / Constructora" },
                { name: "nombre_proyecto", label: "Obra / Proyecto" },
                { name: "fecha_servicio", label: "Fecha", type: "date" },
                { name: "nombre_operador", label: "Operario" },
                { name: "bomba_numero", label: "BOMBA No.", type: "select" },
                { name: "horometro_motor", label: "HOROMETRO MOTOR" },
              ].map((item) => {
                const isHeaderError = camposFaltantes.includes(item.name);
                const isMandatory = item.name === "bomba_numero" || item.name === "horometro_motor";

                return (
                  <div key={item.name} style={{ flex: 1, minWidth: 180 }}>
                    <label className="permiso-trabajo-label">{item.label}{isMandatory}</label>
                    
                    {item.type === "select" ? (
                      <select
                        ref={item.name === "bomba_numero" ? bombaRef : null}
                        name={item.name}
                        value={datos[item.name]}
                        onChange={handle_change}
                        className={`permiso-trabajo-select ${isHeaderError ? 'campo-error' : ''}`}
                      >
                        <option value="">Seleccionar</option>
                        {lista_bombas.map((b, idx) => (
                          <option key={idx} value={b.numero_bomba}>
                            {b.numero_bomba}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        ref={item.name === "horometro_motor" ? horometroRef : null}
                        type={item.type || "text"}
                        name={item.name}
                        value={datos[item.name]}
                        onChange={handle_change}
                        className="permiso-trabajo-input"
                        readOnly={
                          item.name === "nombre_cliente" ||
                          item.name === "nombre_proyecto" ||
                          item.name === "fecha_servicio" ||
                          item.name === "nombre_operador"
                        }
                      />
                    )}
                    {isHeaderError && (
                        <span style={{ color: "red", fontSize: 13 }}>
                            Este campo es obligatorio.
                            <span
                                style={{ marginLeft: 8, cursor: "pointer", fontSize: 18, verticalAlign: "middle" }}
                                onClick={scrollToBottom}
                                title="Ir al botón Guardar"
                            >
                                &#8594;
                            </span>
                        </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Secciones del Checklist */}
          {seccionesEstructura.map((seccion, idx) => (
            <div className="card-section" key={idx} style={{ marginBottom: 16 }}>
              <h4 className="card-title">{seccion.titulo}</h4>

              {seccion.fields.map((field, i) => {
                const isStateError = camposFaltantes.includes(field);
                const isObservationError = camposFaltantes.includes(`${field}_observacion`);
                const needsObservation = estadoItems[field]?.estado === 'REGULAR' || estadoItems[field]?.estado === 'MALO';

                return (
                  <div 
                    key={i} 
                    style={{ marginBottom: 16, paddingBottom: '16px' }}
                    ref={el => itemRefs.current[field] = el}
                  >
                    <div className="permiso-trabajo-label">{fieldToTextMap[field]}</div> 
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <select
                        value={estadoItems[field]?.estado || ""} 
                        onChange={(e) => handleItemStateChange(field, e.target.value)} 
                        className={`permiso-trabajo-select ${isStateError ? 'campo-error' : ''}`}
                        style={{ minWidth: 160, maxWidth: 320 }}
                        >
                        <option value="">--</option>
                        <option value="BUENO">Bueno</option>
                        <option value="REGULAR">Regular</option>
                        <option value="MALO">Malo</option>
                        </select>

                        {isStateError && (
                            <span style={{ color: "red", fontSize: 13 }}>
                                Selección obligatoria.
                                <span
                                    style={{ marginLeft: 8, cursor: "pointer", fontSize: 18, verticalAlign: "middle" }}
                                    onClick={scrollToBottom}
                                    title="Ir al botón Guardar"
                                >
                                    &#8594;
                                </span>
                            </span>
                        )}
                    </div>

                    {needsObservation && (
                      <div style={{ marginTop: 8 }}>
                        <label className="permiso-trabajo-label" style={{ fontSize: '0.9em', fontWeight: 'bold' }}>
                          Observación (Detalle requerido):
                        </label>
                        <textarea
                          ref={el => itemRefs.current[`${field}_observacion`] = el}
                          name={`${field}_observacion`}
                          value={estadoItems[field]?.observacion || ""}
                          onChange={(e) => handleItemObservationChange(field, e.target.value)}
                          className={`permiso-trabajo-input ${isObservationError ? 'campo-error' : ''}`}
                          rows="2"
                          style={{ width: '93%' }}
                        />
                        {isObservationError && (
                            <span style={{ color: "red", fontSize: 13 }}>
                                Detalle de observación obligatorio.
                                <span
                                    style={{ marginLeft: 8, cursor: "pointer", fontSize: 18, verticalAlign: "middle" }}
                                    onClick={scrollToBottom}
                                    title="Ir al botón Guardar"
                                >
                                    &#8594;
                                </span>
                            </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* 3. Campo de Observaciones Generales */}
          <div className="card-section" style={{ marginBottom: 24, padding: '20px' }}>
              <label className="permiso-trabajo-label">Observaciones generales</label>
              <textarea
                name="observaciones"
                value={datos.observaciones}
                onChange={handle_change}
                className="permiso-trabajo-input"
                rows="4"
              />
          </div>

          {/* ==================== 4. SECCIÓN DE FIRMA ELECTRÓNICA ==================== */}
          <div className="card-section" style={{ marginBottom: 24, padding: '20px' }}>
            <h4 className="card-title" style={{ marginBottom: 16 }}>
              ✍️ FIRMA ELECTRÓNICA (Obligatoria)
            </h4>
                {/* Firmante Principal */}
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: 16, 
                  borderRadius: 8, 
                  marginBottom: 16,
                  border: camposFaltantes.includes('firmante_principal') ? '2px solid red' : 'none'
                }}>
                  <h5 style={{ marginBottom: 12 }}>👷 Firmante Principal (Operador)</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label className="permiso-trabajo-label">Nombre completo *</label>
                      <input
                        type="text"
                        value={firmantePrincipal.nombre}
                        onChange={(e) => handleFirmantePrincipalChange('nombre', e.target.value)}
                        className="permiso-trabajo-input"
                        placeholder="Nombre del operador"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <label className="permiso-trabajo-label">Cédula *</label>
                      <input
                        type="text"
                        value={firmantePrincipal.cedula}
                        onChange={(e) => handleFirmantePrincipalChange('cedula', e.target.value)}
                        className="permiso-trabajo-input"
                        placeholder="Número de cédula"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label className="permiso-trabajo-label">Email *</label>
                      <input
                        type="email"
                        value={firmantePrincipal.email}
                        onChange={(e) => handleFirmantePrincipalChange('email', e.target.value)}
                        className="permiso-trabajo-input"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <label className="permiso-trabajo-label">Celular</label>
                      <input
                        type="text"
                        value={firmantePrincipal.celular}
                        onChange={(e) => handleFirmantePrincipalChange('celular', e.target.value)}
                        className="permiso-trabajo-input"
                        placeholder="3001234567"
                      />
                    </div>
                  </div>
                  {camposFaltantes.includes('firmante_principal') && (
                    <span style={{ color: "red", fontSize: 13 }}>
                      Complete nombre, cédula y email del firmante principal.
                    </span>
                  )}
                </div>

                {/* Firmantes Externos */}
                <div style={{ background: '#fff3e0', padding: 16, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h5 style={{ margin: 0 }}>👔 Firmantes Externos (Jefe de Obra, Supervisor, etc.)</h5>
                    <button
                      type="button"
                      onClick={agregarFirmanteExterno}
                      style={{
                        background: '#ff9800',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      + Agregar Firmante
                    </button>
                  </div>

                  {firmantesExternos.map((firmante, index) => {
                    const hasError = camposFaltantes.includes(`firmante_externo_${index}`);
                    const isLast = index === firmantesExternos.length - 1;
                    
                    return (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: 12, 
                        marginBottom: 12,
                        paddingBottom: 12,
                        paddingTop: hasError ? 8 : 0,
                        paddingLeft: hasError ? 8 : 0,
                        paddingRight: hasError ? 8 : 0,
                        borderTop: hasError ? '2px solid red' : 'none',
                        borderLeft: hasError ? '2px solid red' : 'none',
                        borderRight: hasError ? '2px solid red' : 'none',
                        borderBottom: hasError ? '2px solid red' : (!isLast ? '1px solid #ddd' : 'none'),
                        borderRadius: 4
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <label className="permiso-trabajo-label">Nombre</label>
                        <input
                          type="text"
                          value={firmante.nombre}
                          onChange={(e) => handleFirmanteExternoChange(index, 'nombre', e.target.value)}
                          className="permiso-trabajo-input"
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 130 }}>
                        <label className="permiso-trabajo-label">Cédula</label>
                        <input
                          type="text"
                          value={firmante.cedula}
                          onChange={(e) => handleFirmanteExternoChange(index, 'cedula', e.target.value)}
                          className="permiso-trabajo-input"
                          placeholder="Cédula"
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <label className="permiso-trabajo-label">Email</label>
                        <input
                          type="email"
                          value={firmante.email}
                          onChange={(e) => handleFirmanteExternoChange(index, 'email', e.target.value)}
                          className="permiso-trabajo-input"
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 130 }}>
                        <label className="permiso-trabajo-label">Celular</label>
                        <input
                          type="text"
                          value={firmante.celular}
                          onChange={(e) => handleFirmanteExternoChange(index, 'celular', e.target.value)}
                          className="permiso-trabajo-input"
                          placeholder="Celular"
                        />
                      </div>
                      {firmantesExternos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarFirmanteExterno(index)}
                          style={{
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            alignSelf: 'flex-end',
                            marginBottom: 4
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    );
                  })}
                  
                  <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
                    💡 Los firmantes externos recibirán un correo electrónico con el enlace para firmar.
                  </p>
                </div>
          </div>
          {/* ================================================================== */}

          {/* 5. Botón de Guardar */}
          <div style={{ textAlign: "right", marginTop: 24 }} ref={submitRef}>
            <button
              type="submit"
              className="button"
              style={{ background: "#ff9800", color: "#fff", padding: '12px 24px', fontSize: 16 }}
              disabled={enviando}
            >
              {enviando ? "Guardando..." : "Guardar y Enviar a Firma"}
            </button>
          </div>
    </form>
  );
}

export default Checklist;