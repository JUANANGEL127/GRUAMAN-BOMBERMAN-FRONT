import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/permiso_trabajo.css";

// Usa variable de entorno para la base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function toYMD(date) {
  if (!date) return '';
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizaFlag(val) {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "string") {
    if (val.toUpperCase() === "SI") return "Sí";
    if (val.toUpperCase() === "NO") return "No";
    if (val.toUpperCase() === "NA") return "N/A";
  }
  if (typeof val === "boolean") return val ? "Sí" : "No";
  return val;
}

function horasExtraGruaman() {
  const [activeBar, setActiveBar] = useState(""); // "ver", "excel", "pdf"
  const [filters, setFilters] = useState({
    nombre: "",
    cedula: "",
    obra: "",
    constructora: "",
    fecha_inicio: "",
    fecha_fin: "",
    limit: 50,
    offset: 0
  });
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [nombresOperarios, setNombresOperarios] = useState([]);
  const [listaObras, setListaObras] = useState([]);
  const [listaConstructoras, setListaConstructoras] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [resumen, setResumen] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleOpenBar = (bar) => {
    setActiveBar(bar === activeBar ? "" : bar);
    setResultados([]);
    setTotal(0);
    // No resetear offset ni hacer consultas al abrir el menú
    setOpenId(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Buscar resumen de horas extra (ahora usa endpoint admin /buscar) y luego obtiene resumen
  const handleBuscar = async (resetOffset = false) => {
    setLoading(true);
    setErrorMessage("");
    try {
      // Construir body para POST /administrador/admin_horas_extra/buscar y /resumen
      const body = {
        nombre: filters.nombre || "",
        obra: filters.obra || "",
        constructora: filters.constructora || "",
        empresa_id: 1,
        fecha_inicio: toYMD(filters.fecha_inicio),
        fecha_fin: toYMD(filters.fecha_fin),
        limit: filters.limit || 20,
        offset: resetOffset ? 0 : (filters.offset || 0)
      };
      let data = {};
      let resumenData = {};
      let adminError = null;
      try {
        const res = await axios.post(`${API_BASE_URL}/administrador/admin_horas_extra/buscar`, body, {
          headers: { "Content-Type": "application/json" }
        });
        data = res.data || {};
        setResultados(data.rows || []);
        setTotal(data.count || 0);
        setHasSearched(true);
        try {
          // Usar solo el endpoint POST /administrador/admin_horas_extra/resumen
          const resSum = await axios.post(`${API_BASE_URL}/administrador/admin_horas_extra/resumen`, body, {
            headers: { "Content-Type": "application/json" }
          });
          resumenData = resSum.data?.resumen || {};
          setResumen(resumenData);
        } catch (e) {
          setResumen({});
        }
      } catch (err) {
        adminError = err;
      }
      // Si el endpoint admin da error, mostrar mensaje, pero NO hacer fallback a /horas_jornada/resumen
      if (adminError) {
        setErrorMessage(adminError?.response?.data?.error || "Error al realizar la búsqueda.");
        setResultados([]);
        setResumen({});
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  };

  // Descargar resumen en Excel o ZIP (PDFs)
  const handleDescargar = async (tipo) => {
    setLoading(true);
    try {
      const body = {
        nombre: filters.nombre || "",
        obra: filters.obra || "",
        constructora: filters.constructora || "",
        empresa_id: 1,
        fecha_inicio: toYMD(filters.fecha_inicio),
        fecha_fin: toYMD(filters.fecha_fin),
        formato: tipo,
        limit: tipo === "excel" ? 10000 : (filters.limit || 10000)
      };

      // usar fetch para arrayBuffer, compatible con zip/xlsx
      const url = `${API_BASE_URL}/administrador/admin_horas_extra/descargar`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error(`Error descarga: ${resp.status}`);
      const buffer = await resp.arrayBuffer();
      let mime = "application/octet-stream";
      let filename = "archivo";
      if (tipo === "excel") {
        mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = "horas_jornada.xlsx";
      } else if (tipo === "pdf") {
        mime = "application/zip";
        filename = "horas_jornada.zip";
      }
      const blob = new Blob([buffer], { type: mime });
      const link = document.createElement("a");
      const blobUrl = window.URL.createObjectURL(blob);
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Nombres operarios (solo empresa_id === 1)
    async function fetchNombres() {
      try {
        const res = await axios.get(`${API_BASE_URL}/datos_basicos`);
        if (Array.isArray(res.data.datos)) {
          const datosEmpresa = res.data.datos.filter(d => Number(d.empresa_id) === 1);
          setNombresOperarios(datosEmpresa.map(d => d.nombre));
        } else {
          setNombresOperarios([]);
        }
      } catch (e) {
        setNombresOperarios([]);
      }
    }
    fetchNombres();

    // Obras y constructoras (solo empresa_id === 1)
    axios.get(`${API_BASE_URL}/obras`)
      .then(res => {
        const obrasAll = res.data.obras || [];
        const obras = obrasAll.filter(o => Number(o.empresa_id) === 1);
        setListaObras(obras); // mantener objetos para usar obra.id/nombre_obra
        const constructoras = Array.from(new Set(obras.map(o => o.constructora).filter(Boolean)));
        setListaConstructoras(constructoras);
      })
      .catch(() => {
        setListaObras([]);
        setListaConstructoras([]);
      });
  }, []);

  useEffect(() => {
    // Solo ejecutar búsqueda si hay resultados al menos una vez
    if (activeBar === "ver" && hasSearched) {
      handleBuscar(false);
    }
    // eslint-disable-next-line
  }, [filters.offset, filters.limit, hasSearched]);

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
          <button className="permiso-trabajo-btn" onClick={() => handleBuscar(true)} style={{ width: "100%", marginTop: 8 }}>
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
        <h3 className="card-title">Horas Extra </h3>
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
              <>
                {errorMessage && (
                  <div style={{ marginBottom: 10, color: "crimson", fontSize: 13 }}>{errorMessage}</div>
                )}
                <div style={{ marginBottom: 10, fontSize: 14, color: "#222" }}>
                  {total > 0 && (
                    <span>
                      Mostrando { (filters.offset || 0) + 1 } - { Math.min((filters.offset || 0) + (filters.limit || 50), total) } de { total } resultados
                    </span>
                  )}
                </div>

                <ul style={{ listStyle: "none", padding: 0 }}>
                  {resultados.length === 0 ? (
                    <p className="permiso-trabajo-label">No hay resultados disponibles.</p>
                  ) : (
                    resultados.map((r, idx) => (
                      <li
                        key={r.id || idx}
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
                        <div><strong>Fecha:</strong> { (r.fecha_servicio || r.fecha) ? String(r.fecha_servicio || r.fecha).slice(0,10) : "—" }</div>
                        <div><strong>Nombre:</strong> { r.nombre_operador || r.nombre || "—" }</div>
                        <div><strong>Cédula:</strong> { r.numero_identificacion || r.cedula || "—" }</div>
                        <div><strong>Empresa:</strong> { r.nombre_responsable || r.empresa || "—" }</div>
                        <div><strong>Obra:</strong> { r.nombre_proyecto || r.obra || "—" }</div>
                        <div><strong>Constructora:</strong> { r.nombre_cliente || r.constructora || "—" }</div>

                        <button
                          className="permiso-trabajo-btn"
                          style={{ marginTop: 8, fontSize: 13, padding: "4px 10px" }}
                          onClick={() => setOpenId(openId === (r.raw?.id || r.id || idx) ? null : (r.raw?.id || r.id || idx))}
                        >
                          {openId === (r.raw?.id || r.id || idx) ? "Ocultar detalles" : "Ver más"}
                        </button>

                        {openId === (r.raw?.id || r.id || idx) && (r.raw || r) && (
                          <div className="detalle" style={{
                            background: "#fff",
                            border: "1px solid #e0e0e0",
                            borderRadius: 8,
                            marginTop: 10,
                            padding: "10px 8px",
                            fontSize: 13,
                            color: "#222"
                          }}>
                            {Object.entries(r.raw || r).map(([key, val]) => (
                              <div key={key} style={{ marginBottom: 4 }}>
                                <strong>{key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}:</strong>{" "}
                                {typeof val === "string" && ["SI", "NO", "NA"].includes(val.toUpperCase())
                                  ? normalizaFlag(val)
                                  : (val === null || val === undefined || val === "") ? "—" : String(val)}
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))
                  )}
                </ul>

                {total > (filters.limit || 50) && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
                    <button
                      className="permiso-trabajo-btn"
                      style={{ minWidth: 90 }}
                      disabled={loading || filters.offset === 0}
                      onClick={() => setFilters(f => ({ ...f, offset: Math.max(0, f.offset - (f.limit || 50)) }))}
                    >
                      Anterior
                    </button>
                    <button
                      className="permiso-trabajo-btn"
                      style={{ minWidth: 90 }}
                      disabled={loading || filters.offset + (filters.limit || 50) >= total}
                      onClick={() => setFilters(f => ({ ...f, offset: f.offset + (f.limit || 50) }))}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default horasExtraGruaman;