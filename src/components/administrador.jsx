import { useEffect, useState } from "react";
import axios from "axios";

// Componente principal para el panel administrador
function administrador() {
  // Estado para registros, carga y búsqueda
  const [registros, set_registros] = useState([]);
  const [loading, set_loading] = useState(true);
  const [busqueda, set_busqueda] = useState("");
  const api_url = "http://localhost:3000";

  // Cargar registros desde el backend al montar el componente
  useEffect(() => {
    const fetch_data = async () => {
      try {
        const res = await axios.get(`${api_url}/formulario_1/registros_todos_resumen`);
        set_registros(res.data);
      } catch (err) {
        set_registros([]);
      }
      set_loading(false);
    };
    fetch_data();
  }, []);

  // Filtrar registros por nombre, obra, empresa o fecha
  const registros_filtrados = registros.filter(r => {
    if (!busqueda) return true;
    const valor = busqueda.toLowerCase();
    return (
      (r.nombre && r.nombre.toLowerCase().includes(valor)) ||
      (r.empresa && r.empresa.toLowerCase().includes(valor)) ||
      (r.obra && r.obra.toLowerCase().includes(valor)) ||
      (r.fecha && r.fecha.slice(0, 10).includes(valor))
    );
  });

  // Renderizado del panel administrador
  return (
    <div className="app-container">
      <h2>Panel Administrador</h2>
      <div className="app-group">
        <label className="app-label">Buscar por nombre, obra, empresa o fecha:</label>
        <input
          className="app-input"
          type="text"
          value={busqueda}
          onChange={e => set_busqueda(e.target.value)}
          placeholder="Ejemplo: Juan, GyE, Obra1, 2025-09-10"
        />
      </div>
      {loading ? (
        <p className="app-label">Cargando datos...</p>
      ) : (
        <div style={{ marginTop: 32, width: "100%" }}>
          {registros_filtrados.length === 0 ? (
            <p className="app-label">No hay registros disponibles.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {registros_filtrados.map((r, idx) => (
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

export default administrador;
