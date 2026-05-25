import api from "./api";

const API_TO_FRONT_KEY = {
  hora_ingreso: "hora_ingreso",
  hora_salida: "hora_salida",
  permiso_trabajo: "permiso_trabajo",
  chequeo_alturas: "chequeo_alturas",
  chequeo_torregruas: "chequeo_torregruas",
  inspeccion_epcc: "inspeccion_epcc",
  inspeccion_izaje: "inspeccion_izaje",
  chequeo_elevador: "chequeo_elevador",
  ats: "ats",
  planilla_bombeo: "planillabombeo",
  checklist: "checklist",
  inventario_obra: "inventariosobra",
  inspeccion_epcc_bomberman: "inspeccion_epcc_bomberman",
  herramientas_mantenimiento: "herramientas_mantenimiento",
  kit_limpieza: "kit_limpieza",
  pqr: "pqr",
};

export const API_CONTROLLED_FORMAT_KEYS = new Set(Object.values(API_TO_FRONT_KEY));

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "si" || normalized === "sí";
  }
  return false;
}

function readNested(source, key) {
  if (!source || typeof source !== "object") return undefined;
  if (key in source) return source[key];
  if (source.formatos && typeof source.formatos === "object" && key in source.formatos) {
    return source.formatos[key];
  }
  return undefined;
}

function resolveCompletedValue(entry) {
  if (typeof entry === "object" && entry !== null) {
    return toBoolean(entry.completado ?? entry.completed ?? entry.registrado ?? entry.existe);
  }
  return toBoolean(entry);
}

export async function fetchRequiredFormatsStatus() {
  const cedula = localStorage.getItem("cedula_trabajador") || "";
  const obraId = localStorage.getItem("obra_id") || "";
  const empresaId = localStorage.getItem("empresa_id") || "";
  const fecha = new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

  const response = await api.get("/formatos_obligatorios/estado", {
    params: {
      cedula_trabajador: cedula,
      obra_id: obraId,
      empresa_id: empresaId,
      fecha_servicio: fecha,
    },
  });

  const payload = response?.data ?? {};
  const normalized = {};

  Object.entries(API_TO_FRONT_KEY).forEach(([apiKey, frontKey]) => {
    normalized[frontKey] = resolveCompletedValue(readNested(payload, apiKey));
  });

  return normalized;
}
