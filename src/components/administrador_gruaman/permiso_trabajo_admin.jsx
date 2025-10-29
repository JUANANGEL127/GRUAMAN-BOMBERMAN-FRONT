import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/permiso_trabajo.css";

// Helper para formato fecha YYYY-MM-DD
function toYMD(date) {
  if (!date) return '';
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function PermisoTrabajoAdmin() {
  const [activeBar, setActiveBar] = useState(""); // "ver", "excel", "pdf"
  const [filters, setFilters] = useState({
    nombre: "",
    cedula: "",
    obra: "",
    constructora: "",
    fecha_inicio: "",
    fecha_fin: "",
    limit: 20,
    offset: 0
  });
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Buscar cuando cambian offset/limit
  useEffect(() => {
    if (activeBar === "ver") {
      handleBuscar();
    }
    // eslint-disable-next-line
  }, [filters.offset, filters.limit]);

  const handleOpenBar = (bar) => {
    setActiveBar(bar === activeBar ? "" : bar);
    setResultados([]);
    setTotal(0);
    setFilters(f => ({ ...f, offset: 0 }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  async function handleBuscar() {
    setLoading(true);
    try {
      const body = {
        nombre: filters.nombre || '',
        cedula: filters.cedula || '',
        obra: filters.obra || '',
        constructora: filters.constructora || '',
        fecha_inicio: toYMD(filters.fecha_inicio),
        fecha_fin: toYMD(filters.fecha_fin),
        limit: filters.limit || 20,
        offset: filters.offset || 0
      };
      const res = await axios.post('http://localhost:3000/permiso_trabajo_admin/buscar', body);
      setResultados(res.data?.rows || []);
      setTotal(res.data?.count || 0);
    } catch (e) {
      console.error(e);
      setResultados([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function handleDescargar(tipo) {
    setLoading(true);
    try {
      const body = {
        nombre: filters.nombre || '',
        cedula: filters.cedula || '',
        obra: filters.obra || '',
        constructora: filters.constructora || '',
        fecha_inicio: toYMD(filters.fecha_inicio),
        fecha_fin: toYMD(filters.fecha_fin),
        formato: tipo,
        limit: 50000
      };
      const res = await axios.post('http://localhost:3000/permiso_trabajo_admin/descargar', body, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: tipo === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', tipo === 'excel' ? 'permisos_trabajo.xlsx' : 'permisos_trabajo.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

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
            placeholder="Nombre"
            style={{ width: "93%", marginBottom: 6 }}
            disabled={loading}
          />
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
            disabled={loading}
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
            placeholder="Obra"
            style={{ width: "93%", marginBottom: 6 }}
            disabled={loading}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <label style={{ fontSize: 13, color: "#222", marginBottom: 2 }}>Constructora</label>
          <input
            className="permiso-trabajo-input"
            type="text"
            name="constructora"
            value={filters.constructora}
            onChange={handleFilterChange}
            placeholder="Constructora"
            style={{ width: "93%", marginBottom: 6 }}
            disabled={loading}
          />
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
            disabled={loading}
          />
          <input
            className="permiso-trabajo-input"
            type="date"
            name="fecha_fin"
            value={filters.fecha_fin}
            onChange={handleFilterChange}
            style={{ width: "93%", marginBottom: 6 }}
            disabled={loading}
          />
        </div>
        {forAction === "ver" ? (
          <button className="permiso-trabajo-btn" onClick={handleBuscar} style={{ width: "100%", marginTop: 8 }} disabled={loading}>
            Buscar
          </button>
        ) : (
          <>
            <button className="permiso-trabajo-btn" onClick={() => handleDescargar(forAction)} style={{ width: "100%", marginTop: 8 }} disabled={loading}>
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
        <h3 className="card-title">Permiso de Trabajo - Administrador</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", marginBottom: 18 }}>
          <button
            className="permiso-trabajo-btn"
            style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("ver")}
            disabled={loading}
          >
            Ver
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("excel")}
            disabled={loading}
          >
            Descargar en Excel
          </button>
          <button
            className="permiso-trabajo-btn"
            style={{ minWidth: 140 }}
            onClick={() => handleOpenBar("pdf")}
            disabled={loading}
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
                <div style={{ marginBottom: 10, fontSize: 14, color: "#222" }}>
                  {total > 0 && (
                    <span>
                      Mostrando {filters.offset + 1} - {Math.min(filters.offset + filters.limit, total)} de {total} resultados
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
                        <div><strong>Fecha:</strong> {r.fecha ? r.fecha.slice(0, 10) : ""}</div>
                        <div><strong>Nombre:</strong> {r.nombre}</div>
                        <div><strong>Cédula:</strong> {r.cedula || r.numero_identificacion || "—"}</div>
                        <div><strong>Empresa:</strong> {r.empresa}</div>
                        <div><strong>Obra:</strong> {r.obra}</div>
                        <div><strong>Constructora:</strong> {r.constructora}</div>
                        {/* ...otros campos si lo necesitas... */}
                      </li>
                    ))
                  )}
                </ul>
                {total > filters.limit && (
                  <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
                    <button
                      className="permiso-trabajo-btn"
                      style={{ minWidth: 90 }}
                      disabled={loading || filters.offset === 0}
                      onClick={() => setFilters(f => ({ ...f, offset: Math.max(0, f.offset - f.limit) }))}
                    >
                      Anterior
                    </button>
                    <button
                      className="permiso-trabajo-btn"
                      style={{ minWidth: 90 }}
                      disabled={loading || filters.offset + filters.limit >= total}
                      onClick={() => setFilters(f => ({ ...f, offset: f.offset + f.limit }))}
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

export default PermisoTrabajoAdmin;
