import { useState } from "react";

const checklist = [
  {
    categoria: "ROPA DE TRABAJO",
    items: [
      "SASTRE, CAMISAS (PERSONAL ADMON)",
      "CAMISA",
      "JEANS",
      "OVEROL",
    ],
  },
  {
    categoria: "PROTECCIÓN CABEZA",
    items: [
      "CASCO DE SEGURIDAD",
      "CABEZAL CARETA DE SOLDAR",
      "BARBUQUEJO",
    ],
  },
  {
    categoria: "PROTECCIÓN OCULAR",
    items: [
      "GAFAS CLARAS",
      "GAFAS OSCURAS",
      "ACETATO CARETA DE ESMERILAR",
      "CARETA PARA ESMERILAR",
      "CARETA PARA SOLDAR",
    ],
  },
  {
    categoria: "PROTECCIÓN AUDITIVA",
    items: [
      "AUDITIVO DE COPA",
      "AUDITIVO DE INSERCIÓN",
    ],
  },
  {
    categoria: "PROTECCIÓN PIES Y PIERNAS",
    items: [
      "BOTAS DE SEGURIDAD",
      "BOTAS DE CAUCHO",
      "POLAINAS",
      "BOTA PETROLERA",
    ],
  },
  {
    categoria: "PROTECCIÓN RESPIRATORIA",
    items: [
      "RESPIRADOR HUMO",
      "CARTUCHOS RESPIRADORES",
      "RESPIRADOR MATERIAL PARTICULADO",
    ],
  },
  {
    categoria: "PROTECCIÓN MANOS Y BRAZOS",
    items: [
      "GUANTES VAQUETA",
      "GUANTES DE NYLON",
      "GUANTES CAUCHO",
      "GUANTES DE LÁTEX",
      "GUANTES SOLDADOR",
      "GUANTES NITRILO",
      "MANGAS SOLDADOR",
    ],
  },
  {
    categoria: "TRAJES ESPECIALES",
    items: [
      "IMPERMEABLE",
      "CHALECO REFLECTIVO",
      "PETO CARNAZA PARA SOLDAR",
    ],
  },
];

function Epps() {
  const [seleccionados, setSeleccionados] = useState({});

  const handleCheck = (categoria, item) => {
    setSeleccionados((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  return (
    <div className="app-container">
      <h2>Checklist EPPs</h2>
      {checklist.map((grupo) => (
        <div key={grupo.categoria} style={{ marginBottom: 24 }}>
          <h3 style={{ color: "#1976d2", fontSize: "1.1em", marginBottom: 10 }}>{grupo.categoria}</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {grupo.items.map((item) => (
              <li key={item} style={{ marginBottom: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={!!seleccionados[item]}
                    onChange={() => handleCheck(grupo.categoria, item)}
                  />
                  {item}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default Epps;
