import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/permiso_trabajo.css";

function Checklist() {
  const [datos, setDatos] = useState({
    nombre_cliente: "",
    nombre_proyecto: "",
    fecha_servicio: "",
    bomba_numero: "",
    horometro_motor: "",
    nombre_operador: "",
  });

  const [lista_bombas, set_lista_bombas] = useState([]);
  const [estadoItems, setEstadoItems] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mensajeEnvio, setMensajeEnvio] = useState("");

  const nombre_operador_local = localStorage.getItem("nombre_trabajador") || "";
  const nombre_obra_local = localStorage.getItem("obra") || "";

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

  const secciones = [
    {
      titulo: "CHASIS",
      items: [
        "Revisar el nivel de aceite del motor.",
        "Revise el nivel del tanque de combustible.",
        "Revise el nivel del refrigerante.",
        "Revise el nivel del aceite de la hidrolavadora",
        "Revise la condición y la presión de las llantas.",
        "Revise las fugas de combustible, aceite y otras fugas.",
        "Revise el sub-chasis para detectar grietas de soldadura, pernos faltantes, deformaciones.",
        "Revise la integridad estructural de la cubierta.",
        "Revise que las cajas de herramientas y productos diversos estén aseguradas.",
        "Revise sistema de drenaje de la alberca.",
        "Revisión del filtro hidraúlico del equipo.",
        "Revisión del filtro del agua debe encontrarse limpio.",
        "Revisar el nivel del agua que se encuentre lleno.",
      ],
    },
    {
      titulo: "PIEZAS DE DESGASTE Y SALIENTES",
      items: [
        "Revise anillo de corte y anillo de sujeción.",
        "Revise que el anillo de corte no presente desgaste prematuro",
        "Revise placa gafa.",
        "Revisar que los cilindros de empuje o camisas de concreto estén asegurados y bien atornillados.",
        "Revise los pistones y asegure que no exista paso de masilla para la caja de refrigeración.",
        "Revise los pistones y asegure que no exista paso de agua a la tolva.",
        "Revise la condición de las mangueras y tubos hidráulicos.",
        "Revisar si hay partes faltantes tales como pasadores, pernos y tuercas.",
        "Revise que la caja de agua sea estructuralmente rígida, esté limpia, con la cubierta en su lugar y que el drenaje sea funcional.",
        "Revise que el mecanismo de cambio del tubo en “S” sea estructuralmente rígido.",
        "Revisar que la rejilla de la tolva no este partida y que este funcionando el sensor.",
        "Revise el estado del oring de la escotilla.",
        "Revisar que el vibrador esté montado en forma segura y que las conexiones de los cables estén aseguradas y este funcionando correctamente.",
        "Revise que las paletas y el eje del agitador no estén dañados y revise si hay soldaduras agrietadas.",
        "Revise si el motor de accionamiento está asegurado y si los cojinetes, sellos y caja están en buenas condiciones.",
        "Revise que la válvula de control esté montada en forma segura y que las palancas se muevan libremente.",
      ],
    },
    {
      titulo: "SISTEMA HIDRÁULICO",
      items: [
        "Revisar que no existan fugas hidraulicas, estrangule la maquina antes de inciar el servicio.",
        "Revisar si los cilindros hidráulicos o botellas impulsadoras esten asegurados y en buenas condiciones.",
        "Revise que el indicador visible de nivel aceite hidraulico esté en buenas condiciones.",
        "Revise enfriador aceite hidraulico y su termostato.",
        "Revisar los indicadores de la condición del filtro hidráulico.",
        "Revisar que el filtro hidraulico no tenga limalla",
        "Revise que las mangueras y tubos estén asegurados, sin fugas y que tengan un mínimo desgaste.",
      ],
    },
    {
      titulo: "SISTEMA DE LUBRICACIÓN",
      items: [
        "Revise el nivel del depósito de grasa.",
        "Revise puntos de lubricación  (yugos, checks de distribución, ductos, mangueras distribución de grasa,  tarro general de autoengrase, arbol trasero.)",
        "Revise si las empaquetaduras de  conexión del tubo en “S” en los sellos de salida y cojinetes se encuentran lubricadas.",
        "Revise el nivel de agua de caja de lubricación de los pistones.",
      ],
    },
    {
      titulo: "MANGUERAS (3\", 4\", 5\")",
      items: [
        "Revisión interna que la manguera no se encuentre deshilachada.",
        "Revisión de acoples que se encuentren en buen estado.",
        "Revisión externa de que la manguera no este deshilachada.",
      ],
    },
    {
      titulo: "SISTEMA ELÉCTRICO",
      items: [
        "Revisar que los interruptores estén en buenas condiciones, permanezcan en su posición o regresen momentáneamente al centro.",
        "Revisar que los instrumentos e indicadores estén en buenas condiciones y que las luces funcionen.",
        "Revisar que las cubiertas de caucho de protección estén en buenas condiciones.",
        "Revisar que el cordón  de mando estén en buenas condiciones, que no esté dañado ni cortado, y que esté conectado en forma segura.",
        "Revise que los interruptores no estén dañados y revise las funciones de presionar/tirar de los interruptores de parada de emergencia.",
        "Revisar que las conexiones eléctricas estén bien aseguradas y libres de óxido.",
        "Revisar paros de emergencia.",
        "Revisar que los aisladores de los cables no estén desgastados ni descascarados.",
      ],
    },
    {
      titulo: "TUBERÍA",
      items: [
        "Revisar que el codo de salida esté asegurado y que la abrazadera esté fija.",
        "Colocación de tubería y tallo (bien anclada a la estructura).",
        "Revise si las abrazaderas de los tubos de descarga están flojas o dañadas.",
        "Revise espesores de tubería.",
        "Revise que la vertical o tallo se encuentre recta.",
        "Revisar el area de desplazamiento de la tuberia y que sea segura para su manipulacion y descargue Operador y auxiliar.",
      ],
    },
    {
      titulo: "SEGURIDAD Y SALUD EN EL TRABAJO (SST)",
      items: [
        "El equipo debe estar completamente limpio, sin excesos de grasa  antigua, ni concreto en partes como vibrador, parrilla y tolva, abrazaderas, empaques, tubería y mangueras.",
        "Revisión orden y aseo",
        "Revisión delimitación area y etiquetado productos",
        "Revisar permisos de trabajo y ATS y dejar firmados según la periodicidad que corresponda.",
        "Revisión fecha de vencimiento extintores y marcación visible.",
        "Revisión elementos del botiquin (stock y fechas de vencimiento).",
        "Revisar que se encuentre vigente fecha de recertificación de arnes y eslinga, revisar que ambos se encuentren en buen estado y limpios.",
        "Revisar y diligenciar formato de revisión del estado de los equipos de protección contra caídas.",
        "Revisar estado de dotación (camisa, pantalon, botas)",
        "Revisar estado de EPP (Casco, gafas, tapaoidos, tapabocas, barbuquejo, guantes)",
        "Rotulación obligatoria de ACPM, GRASA LITIO y de AGUA NO POTABLE.",
        "Matriz de compatibilidad de ACPM y GRASA.",
        "Demarcación del área donde se encuentra la bomba.",
        "Orden y aseo (bomba y alrededor libre de concreto)",
        "Revise que el operario y ayudante porte: (Casco, Guantes, Tapa oidos, Barbuquejo, Botas, Uniforme de la empresa)",
        "Revise kit de mantenimiento y herramientas y verificar con administración.",
        "Revisión cantidad de combustble y stock verificar con administración.",
        "Revisión horas de motor y verificar con administración para mantenimiento.",
        "Revisar grasa y verificar con administración.",
        "Revise planillas para confirmar horas trabajadas, metros cubicos bombeados, formato diligenciado total.",
      ],
    },
  ];

  useEffect(() => {
    const inicial = secciones.reduce((acc, seccion) => {
      seccion.items.forEach((item) => (acc[item] = ""));
      return acc;
    }, {});
    setEstadoItems(inicial);
  }, []); // eslint-disable-line

  const handle_change = (e) => {
    const { name, value } = e.target;
    setDatos((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (item, valor) => {
    setEstadoItems((prev) => ({ ...prev, [item]: valor }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensajeEnvio("");

    const payload = {
      ...datos,
      checklist: { ...estadoItems },
    };

    try {
      await axios.post("http://localhost:3000/bomberman/checklist", payload);
      setMensajeEnvio("✅ Checklist guardado correctamente.");
      // reset items
      const limpio = secciones.reduce((acc, s) => {
        s.items.forEach((i) => (acc[i] = ""));
        return acc;
      }, {});
      setEstadoItems(limpio);
    } catch (err) {
      console.error(err);
      setMensajeEnvio("❌ Error al guardar el checklist.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      {/* Datos Generales */}
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
          ].map((item) => (
            <div key={item.name} style={{ flex: 1, minWidth: 180 }}>
              <label className="permiso-trabajo-label">{item.label}</label>
              {item.type === "select" ? (
                <select
                  name={item.name}
                  value={datos[item.name]}
                  onChange={handle_change}
                  className="permiso-trabajo-select"
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
            </div>
          ))}
        </div>
      </div>

      {/* Secciones del checklist */}
      {secciones.map((seccion, idx) => (
        <div className="card-section" key={idx} style={{ marginBottom: 16 }}>
          <h4 className="card-title">{seccion.titulo}</h4>

          {seccion.items.map((item, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div className="permiso-trabajo-label">{item}</div>
              <select
                value={estadoItems[item] || ""}
                onChange={(e) => handleItemChange(item, e.target.value)}
                className="permiso-trabajo-select"
                style={{ minWidth: 160, maxWidth: 320 }}
              >
                <option value="">--</option>
                <option value="Bueno">Bueno</option>
                <option value="Regular">Regular</option>
                <option value="Malo">Malo</option>
              </select>
            </div>
          ))}
        </div>
      ))}

      <div style={{ textAlign: "right", marginTop: 24 }}>
        <button
          type="submit"
          className="button"
          style={{ background: "#ff9800", color: "#fff" }}
          disabled={enviando}
        >
          {enviando ? "Guardando..." : "Guardar Checklist"}
        </button>
      </div>

      {mensajeEnvio && (
        <p
          style={{
            marginTop: 12,
            textAlign: "center",
            color: mensajeEnvio.includes("✅") ? "green" : "red",
          }}
        >
          {mensajeEnvio}
        </p>
      )}
    </form>
  );
}

export default Checklist;

