import { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/bomberman/checklist.css";

// Componente principal para el checklist de inspección de bomba
function Checklist() {
  // Estado para los datos generales del encabezado
  const [datos, setDatos] = useState({
    nombre_cliente: "",
    nombre_proyecto: "",
    fecha_servicio: "",
    bomba_numero: "",
    nombre_operador: "",
  });

  // Estado para la lista de bombas
  const [lista_bombas, set_lista_bombas] = useState([]);
  // Estado para los ítems del checklist
  const [estadoItems, setEstadoItems] = useState({});
  // Estado para envío y mensaje de resultado
  const [enviando, setEnviando] = useState(false);
  const [mensajeEnvio, setMensajeEnvio] = useState("");

  // Obtener datos de operador y obra desde localStorage
  const nombre_operador_local = localStorage.getItem("nombre_trabajador") || "";
  const nombre_obra_local = localStorage.getItem("obra") || "";

  // Cargar datos del encabezado desde backend y localStorage
  useEffect(() => {
    const fecha_hoy = new Date().toISOString().slice(0, 10);
    axios
      .get("http://localhost:3000/obras")
      .then((res) => {
        const obras = Array.isArray(res.data.obras)
          ? res.data.obras
          : res.data || [];
        const obra_encontrada = obras.find(
          (o) => o.nombre_obra === nombre_obra_local
        );
        const constructora = obra_encontrada ? obra_encontrada.constructora : "";
        setDatos((prev) => ({
          ...prev,
          nombre_cliente: constructora,
          nombre_proyecto: nombre_obra_local,
          fecha_servicio: fecha_hoy,
          nombre_operador: nombre_operador_local,
        }));
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

  // Cargar lista de bombas desde backend
  useEffect(() => {
    axios
      .get("http://localhost:3000/bombas")
      .then((res) => {
        const bombas = Array.isArray(res.data.bombas)
          ? res.data.bombas
          : res.data || [];
        set_lista_bombas(bombas);
      })
      .catch(() => set_lista_bombas([]));
  }, []);

  // Definición de secciones e ítems del checklist
  const secciones = [
    {
      titulo: "SECCIÓN: CHASIS",
      items: [
        "Revise el nivel de aceite del motor",
        "Revise el funcionamiento de combustible",
        "Revise el nivel del refrigerante",
        "Revise el nivel de aceite de los hidráulicos",
        "Revise las fugas de combustible, aceite y otras fugas",
        "Revise las luces y protector grilles de soldadura",
        "Revise los limpiabrisas",
        "Revise la integridad estructural de la cubierta",
        "Revise las herramientas y productos diversos",
        "Revise sistema de frenos",
        "Revise el sistema de la alberca",
        "Revise la limpieza del equipo de concreto limpio",
        "Revise el nivel del agua de succión lleno",
        "Revise el gato y las llaves de control",
        "Revise el anillo del control no presente desgaste prematuro",
        "Revise placa garra",
      ],
    },
    {
      titulo: "SECCIÓN: PIEZAS DE GOBSET Y SALIENTES",
      items: [
        "Revise que los cilindros de empuje o camisas de concreto estén asegurados y bien atornillados",
        "Revise los pistones",
        "Revise los cilindros y asegure que no exista paso de agua de la caja hacia el sistema hidráulico",
        "Revise la condición de las mangueras y tubos hidráulicos",
        "Revisar si hay partes faltantes tales como pasadores, pernos y tuercas",
        "Limpie la caja de agua estructuralmente rígida, esté limpia, con su lubricante y que drene sin fugas",
        "Revise el mecanismo de cambio del tubo en “S” sea estructuralmente rígido",
        "Revise que el anillo del tubo no esté partido y que tenga sello firme",
        "Revise el estado del eje de la osciltilla",
        "Revise que el vibrador esté funcionando correctamente",
        "Revise la válvula de control esté montada en forma segura y que las conexiones estén bien ajustadas",
        "Revise que no existan fugas hidráulicas, estrangule la manguera antes de iniciar operación",
      ],
    },
    {
      titulo: "SECCIÓN: SISTEMA HIDRÁULICO",
      items: [
        "Revise que los cilindros hidráulicos o botellas impulsadoras estén asegurados y en buenas condiciones",
        "Revise que el indicador visible del nivel aceite hidráulico esté en buen funcionamiento",
        "Revise enfriador aceite hidráulico y su termostato",
        "Revise los indicadores de la condición del filtro hidráulico",
        "Revise que las mangueras y tubos estén asegurados, sin fugas y que tengan un mínimo desgaste",
      ],
    },
    {
      titulo: "SECCIÓN: SUPERFICIE",
      items: [
        "Revise el nivel del depósito de grasa",
        "Revise puntos de lubricación (juegos, check de distribución, ductos, mangueras de distribución de grasa, tarro general de autograsaje, árbol trasero)",
        "Revise las empaquetaduras de conexión del tubo en “S” en los sellos de salida y conexiones se encuentren lubricadas",
      ],
    },
    {
      titulo: "SECCIÓN: MANGUERAS",
      items: [
        "Revise el nivel de agua de caja de lubricación de los pistones",
        "Revise internamente que la manguera no se encuentre deshilachada",
        "Revise los acoples que se encuentren en buen estado",
        "Revise el extremo que une la manguera no esté deshilachado",
      ],
    },
    {
      titulo: "SECCIÓN: SISTEMA ELÉCTRICO",
      items: [
        "Revise que los interruptores estén en buenas condiciones, se mantengan en su posición y respondan normalmente al comando",
        "Revise que los interruptores indicadores estén en buenas condiciones y que las luces funcionen correctamente",
        "Revise que las cubiertas de caucho de protección estén en buenas condiciones",
        "Revise que el cordón de mando esté en buenas condiciones, no esté dañado ni cortado, y que esté conectado de forma segura",
        "Revise que los interruptores no estén dañados y revise las funciones de presionamiento de los interruptores de parada de emergencia",
        "Revise que las conexiones eléctricas estén bien aseguradas y libres de óxido",
        "Revise las cajas de emergencia",
        "Revise que los aisladores de los cables no estén resquebrajados ni descarapelados",
        "Revise paros de emergencia",
        "Revise que el foco de salida esté asegurado y que la abrazadera esté fija",
      ],
    },
    {
      titulo: "SECCIÓN: TUBERÍA",
      items: [
        "Colocación de bujía y tallo (bien anclada a la estructura)",
        "Revise las abrazaderas de los tubos de descarga estén bien ajustadas",
        "Revise que la vertical o tallo se encuentre recta",
        "Revise el área del desplazamiento de la tubería que se encuentre segura para su manipulación y descargue",
        "El equipo debe estar completo con todos sus implementos (tuberías, abrazaderas, codos, bujía, manguera, pistón, vibrador, parrilla, agua, grasa, conexiones)",
      ],
    },
    {
      titulo: "SECCIÓN: SEGURIDAD Y SALUD EN EL TRABAJO (SST)",
      items: [
        "Revisión delimitación área y etiquetado productos",
        "Revisión procedimientos de trabajo y ATS del día firmados según la periodicidad del cronograma",
        "Extintor con sello y recarga con marcación visible",
        "Revisión de botiquín (stock y fechas vigentes)",
        "Revisión de señalización visible y en buen estado",
        "Verificación de iluminación correcta del área de trabajo",
        "Revisión del estado de elementos de control (vallas, cinta, topellantas, barriquejo)",
        "Revisión de EPP (Casco, gafas, tapaoídos, tapabocas, botas, guantes, barbuquejo)",
      ],
    },
    {
      titulo: "SECCIÓN: SEGURIDAD Y SALUD",
      items: [
        "Rotulación obligatoria de ACPM, GRASA LITIO y de AGUA NO POTABLE",
        "Matriz de compatibilidad de ACPM y GRASA",
        "Demarcación del área donde se encuentra la bomba",
        "Orden y aseo (bomba y alrededores libres de concreto)",
        "Revise que el operario y ayudante porte los EPP (casco, guantes, tapa oídos, barbuquejo, botas, uniforme de la empresa)",
        "Revise kit de mantenimiento y herramientas, y verificar con administración",
        "Revisión cantidad de combustible y stock, verificar con administración",
        "Revisión horas de motor y verificar con administración para mantenimiento",
        "Revisar grasa y verificar con administración",
        "Revise planillas para confirmar horas trabajadas, metros cúbicos bombeados, formato diligenciado total",
      ],
    },
  ];

  // Inicializar estado de ítems del checklist
  useEffect(() => {
    const inicial = secciones.reduce((acc, seccion) => {
      seccion.items.forEach((item) => (acc[item] = ""));
      return acc;
    }, {});
    setEstadoItems(inicial);
  }, []);

  // Manejar cambios en los campos generales
  const handle_change = (e) => {
    const { name, value } = e.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar cambios en los radios de cada ítem
  const handleItemChange = (item, valor) => {
    setEstadoItems((prev) => ({ ...prev, [item]: valor }));
  };

  // Enviar checklist al backend y mostrar mensaje de resultado
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensajeEnvio("");
    const payload = {
      ...datos,
      checklist: Object.fromEntries(
        Object.entries(estadoItems).map(([item, valor]) => [
          item,
          valor === "bueno",
        ])
      ),
    };
    try {
      await axios.post("http://localhost:3000/bomberman/checklist", payload);
      setMensajeEnvio("✅ Checklist guardado correctamente.");
      setEstadoItems(
        secciones.reduce((acc, s) => {
          s.items.forEach((i) => (acc[i] = ""));
          return acc;
        }, {})
      );
    } catch (err) {
      setMensajeEnvio("❌ Error al guardar el checklist.");
    } finally {
      setEnviando(false);
    }
  };

  // Renderizado del formulario checklist
  return (
    <div className="checklist-container">
      <h2>Checklist de Inspección de Bomba</h2>
      <form onSubmit={handleSubmit} className="checklist-form">
        {/* Encabezado */}
        <div className="encabezado">
          {Object.entries(datos).map(([key, value]) => (
            <div key={key} className="input-group">
              <label>{key.replace(/_/g, " ")}:</label>
              {key === "bomba_numero" ? (
                <select
                  name={key}
                  value={value}
                  onChange={handle_change}
                  required
                >
                  <option value="">Seleccionar bomba</option>
                  {lista_bombas.map((b, idx) => (
                    <option key={idx} value={b.numero_bomba}>
                      {b.numero_bomba}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name={key}
                  value={value}
                  onChange={handle_change}
                  readOnly={
                    key === "nombre_proyecto" ||
                    key === "fecha_servicio" ||
                    key === "nombre_operador"
                  }
                />
              )}
            </div>
          ))}
        </div>
        {/* Secciones del checklist */}
        {secciones.map((seccion, idx) => (
          <div key={idx} className="seccion">
            <h3>{seccion.titulo}</h3>
            {seccion.items.map((item, i) => (
              <div key={i} className="item">
                <span>{item}</span>
                <div className="opciones">
                  {["bueno", "regular", "malo"].map((opcion) => (
                    <label key={opcion}>
                      <input
                        type="radio"
                        name={`item-${idx}-${i}`}
                        checked={estadoItems[item] === opcion}
                        onChange={() => handleItemChange(item, opcion)}
                      />
                      {opcion.charAt(0).toUpperCase() + opcion.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
        <button type="submit" disabled={enviando} className="btn-guardar">
          {enviando ? "Guardando..." : "Guardar Checklist"}
        </button>
        {mensajeEnvio && <p className="mensaje-envio">{mensajeEnvio}</p>}
      </form>
    </div>
  );
}

export default Checklist;
