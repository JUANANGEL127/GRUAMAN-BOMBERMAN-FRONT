import { useEffect, useState } from "react";
import axios from "axios";


function Administrador() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const API_URL = "http://localhost:3000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/formulario1/registros-todos-resumen`);
        setRegistros(res.data);
      } catch (err) {
        setRegistros([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filtrar registros por nombre, obra, empresa o fecha
  const registrosFiltrados = registros.filter(r => {
    if (!busqueda) return true;
    const valor = busqueda.toLowerCase();
    return (
      (r.nombre && r.nombre.toLowerCase().includes(valor)) ||
      (r.empresa && r.empresa.toLowerCase().includes(valor)) ||
      (r.obra && r.obra.toLowerCase().includes(valor)) ||
      (r.fecha && r.fecha.slice(0, 10).includes(valor))
    );
  });

  
  return (
    <div className="app-container">
      <h2>Panel Administrador</h2>
      <div className="app-group">
        <label className="app-label">Buscar por nombre, obra, empresa o fecha:</label>
        <input
          className="app-input"
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Ejemplo: Juan, GyE, Obra1, 2025-09-10"
        />
      </div>
      {loading ? (
        <p className="app-label">Cargando datos...</p>
      ) : (
        <div style={{ marginTop: 32, width: "100%" }}>
          {registrosFiltrados.length === 0 ? (
            <p className="app-label">No hay registros disponibles.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {registrosFiltrados.map((r, idx) => (
                <li key={idx} style={{ background: "#f7fbff", marginBottom: 18, padding: 14, borderRadius: 8 }}>
                  <div><strong>Fecha:</strong> {r.fecha ? r.fecha.slice(0, 10) : ""}</div>
                  <div><strong>Nombre:</strong> {r.nombre}</div>
                  <div><strong>Número de identificación:</strong> {r.numero_identificacion}</div>
                  <div><strong>Empresa:</strong> {r.empresa}</div>
                  <div><strong>Nombre de obra:</strong> {r.obra}</div>
                  <div><strong>Horas trabajadas usuario:</strong> {r.horas_usuario}</div>
                  <div><strong>Horas trabajadas sistema:</strong> {r.horas_sistema}</div>
                  <div><strong>Horas extras usuario:</strong> {r.horas_extras_usuario}</div>
                  <div><strong>Horas extras sistema:</strong> {r.horas_extras_sistema}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default Administrador;
