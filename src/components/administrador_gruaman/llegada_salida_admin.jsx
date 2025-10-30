import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/permiso_trabajo.css";

function LlegadaSalidaAdmin() {
  const [activeBar, setActiveBar] = useState(""); // "ver", "excel", "pdf"
  const [filters, setFilters] = useState({
    nombre: "",
    cedula: "",
    obra: "",
    constructora: "",
    fecha_inicio: "",
    fecha_fin: ""
  });
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nombresOperarios, setNombresOperarios] = useState([]);
  const [listaObras, setListaObras] = useState([]);
  const [listaConstructoras, setListaConstructoras] = useState([]);

  const handleOpenBar = (bar) => {
    setActiveBar(bar === activeBar ? "" : bar);
    setResultados([]);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  function toYMD(date) {
    if (!date) return '';
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    const d = new Date(date);
    // Ajuste para compensar la zona horaria y evitar desfase de un día
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const handleBuscar = async () => {
    setLoading(true);
    try {
      const body = {
        ...filters,
        fecha_inicio: toYMD(filters.fecha_inicio),
        fecha_fin: toYMD(filters.fecha_fin)
      };
      const res = await axios.post("http://localhost:3000/llegada_salida_admin/buscar", body);
      setResultados(res.data || []);
    } catch (err) {
      setResultados([]);
    }
    setLoading(false);
  };

  const handleDescargar = async (tipo) => {
    setLoading(true);
    try {
      const body = {
        ...filters,
        fecha_inicio: toYMD(filters.fecha_inicio),
        fecha_fin: toYMD(filters.fecha_fin),
        formato: tipo
      };
      const res = await axios.post(
        `http://localhost:3000/llegada_salida_admin/descargar`,
        body,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `llegada_salida.${tipo === "excel" ? "xlsx" : "pdf"}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      // Error al descargar
    }
    setLoading(false);
  };

  useEffect(() => {
    // Nombres operarios
    async function fetchNombres() {
      try {
        const res = await axios.get("http://localhost:3000/datos_basicos");
        if (Array.isArray(res.data.datos)) {
          setNombresOperarios(res.data.datos.map(d => d.nombre));
        } else {
          setNombresOperarios([]);
        }
      } catch (e) {
        setNombresOperarios([]);
      }
    }
    fetchNombres();

    // Obras y constructoras
    axios.get("http://localhost:3000/obras")
      .then(res => {
        const obras = res.data.obras || [];
        setListaObras(obras);
        const constructoras = Array.from(new Set(obras.map(o => o.constructora).filter(Boolean)));
        setListaConstructoras(constructoras);
      })
      .catch(() => {
        setListaObras([]);
        setListaConstructoras([]);
      });
  }, []);

  const renderBarraBusqueda = (forAction) => (
    <div className="card-section" style={{ marginBottom: 18 }}>
      <div style={{ marginBottom: 10, fontWeight: 600, color: "#222", fontSize: 15 }}>
        Ingresa uno o más parámetros para filtrar los resultados:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Nombre</label>
          <input
            className="permiso-trabajo-input"
            type="text"
            name="nombre"
            value={filters.nombre}
            onChange={handleFilterChange}
            placeholder="Buscar o selecciona nombre"
            style={{ width: "93%", marginBottom: 6 }}
            list="lista-nombres-operarios"
          />
          <datalist id="lista-nombres-operarios">
            {nombresOperarios.map((nombre, i) => (
              <option key={i} value={nombre} />
            ))}
          </datalist>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Cédula</label>
          <input
            className="permiso-trabajo-input"
            type="text"
            name="cedula"
            value={filters.cedula}
            onChange={handleFilterChange}
            placeholder="Cédula"
            style={{ width: "93%", marginBottom: 6 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Obra</label>
          <input
            className="permiso-trabajo-input"
            type="text"
            name="obra"
            value={filters.obra}
            onChange={handleFilterChange}
            placeholder="Buscar o selecciona obra"
            style={{ width: "93%", marginBottom: 6 }}
            list="lista-obras"
          />
          <datalist id="lista-obras">
            {listaObras.map((obra) => (
              <option key={obra.id} value={obra.nombre_obra}></option>
            ))}
          </datalist>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Constructora</label>
          <input
            className="permiso-trabajo-input"
            type="text"
            name="constructora"
            value={filters.constructora}
            onChange={handleFilterChange}
            placeholder="Buscar o selecciona constructora"
            style={{ width: "93%", marginBottom: 6 }}
            list="lista-constructoras"
          />
          <datalist id="lista-constructoras">
            {listaConstructoras.map((c, i) => (
              <option key={i} value={c}></option>
            ))}
          </datalist>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Rango de Fechas</label>
          <input
            className="permiso-trabajo-input"
            type="date"
            name="fecha_inicio"
            value={filters.fecha_inicio}
            onChange={handleFilterChange}
            style={{ width: "93%", marginBottom: 6 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <input
            className="permiso-trabajo-input"
            type="date"
            name="fecha_fin"
            value={filters.fecha_fin}
            onChange={handleFilterChange}
            style={{ width: "93%", marginBottom: 6 }}
          />
        </div>
        {forAction === "ver" ? (
          <button className="permiso-trabajo-btn" onClick={handleBuscar} style={{ width: "100%", marginTop: 8 }}>
            Buscar
          </button>
        ) : (
          <>
            <button className="permiso-trabajo-btn" onClick={() => handleDescargar(forAction)} style={{ width: "100%", marginTop: 8 }}>
              Descargar
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="form-container">
      <div className="card-section" style={{ marginBottom: 24 }}>
        <h3 className="card-title">Llegada y Salida - Administrador</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", marginBottom: 18 }}>
          <button
            className="permiso-trabajo-btn"
            style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("ver")}
          >
            Ver
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("excel")}
          >
            Descargar en Excel
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("pdf")}
          >
            Descargar en PDF
          </button>
        </div>
        {activeBar && renderBarraBusqueda(activeBar)}
        {activeBar === "ver" && (
          <div className="card-section" style={{ marginTop: 12 }}>
            {loading ? (
              <p className="permiso-trabajo-label">Cargando datos...</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {resultados.length === 0 ? (
                  <p className="permiso-trabajo-label">No hay resultados disponibles.</p>
                ) : (
                  resultados.map((r, idx) => (
                    <li
                      key={idx}
                      style={{
                        background: "#f7fbff",
                        marginBottom: 12,
                        padding: "10px 12px",
                        borderRadius: 8,
                        minWidth: 220,
                        maxWidth: 320,
                        fontSize: 14,
                        boxShadow: "0 1px 4px #e0e0e0",
                        marginLeft: "auto",
                        marginRight: "auto"
                      }}
                    >
                      <div><strong>Fecha:</strong> {r.fecha ? r.fecha.slice(0, 10) : ""}</div>
                      <div><strong>Nombre:</strong> {r.nombre}</div>
                      <div><strong>Cédula:</strong> {r.cedula}</div>
                      <div><strong>Empresa:</strong> {r.empresa}</div>
                      <div><strong>Obra:</strong> {r.obra}</div>
                      <div><strong>Constructora:</strong> {r.constructora}</div>
                      {/* Agrega más campos si lo necesitas */}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LlegadaSalidaAdmin;
