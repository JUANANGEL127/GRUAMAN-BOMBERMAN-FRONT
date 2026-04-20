import { todayStrBogota } from "../../utils/dateUtils";

export const INDICADOR_CENTRAL_GRANULARITIES = Object.freeze({
  PERSONA_DIA: "persona_dia",
  PERSONA_UNICA_MENSUAL: "persona_unica_mensual",
  MENSUAL_ACUMULADO: "mensual_acumulado",
  DESCONOCIDA: "desconocida",
});

export const INDICADOR_CENTRAL_DEFAULT_CUT_TYPES = Object.freeze(["diario", "mensual"]);

export function createDefaultIndicadorCentralScope() {
  return {
    empresaIds: [1, 2],
    obraId: null,
    obraNombre: null,
    segmentarPorObra: false,
    nombres: [],
  };
}

export function createDefaultIndicadorCentralThresholds() {
  return {
    alertaPct: 70,
    objetivoPct: 90,
  };
}

export function createDefaultIndicadorCentralFormatsByCompany() {
  return {
    "1": [],
    "2": [],
  };
}

export function createDefaultIndicadorCentralConfig() {
  return {
    destinatarios: [],
    umbrales: createDefaultIndicadorCentralThresholds(),
    formatosPorEmpresa: createDefaultIndicadorCentralFormatsByCompany(),
    exclusiones: [],
    distribucionHabilitada: false,
    scope: createDefaultIndicadorCentralScope(),
  };
}

export function createDefaultIndicadorCentralDownloadRequest() {
  const today = todayStrBogota();

  return {
    nombre: "",
    fechaInicio: today,
    fechaFin: today,
    corteTipo: "diario",
    limit: 10000,
  };
}

export function createDefaultIndicadorCentralExecution() {
  const today = todayStrBogota();

  return {
    fechaCorte: today,
    corteTipo: "diario",
    nombre: "",
  };
}

export function createDefaultIndicadorCentralResult() {
  return {
    success: false,
    alreadyProcessed: false,
    snapshotBatchId: null,
    resumen: null,
    granularidad: INDICADOR_CENTRAL_GRANULARITIES.DESCONOCIDA,
    estado: null,
    errorMessage: null,
    workbookUrl: null,
    workbookFileName: null,
    workbookAvailable: false,
  };
}
