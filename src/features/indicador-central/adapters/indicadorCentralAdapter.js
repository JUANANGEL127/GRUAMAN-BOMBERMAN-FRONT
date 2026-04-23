import {
  createDefaultIndicadorCentralConfig,
  createDefaultIndicadorCentralDownloadRequest,
  createDefaultIndicadorCentralExecution,
  createDefaultIndicadorCentralFormatsByCompany,
  createDefaultIndicadorCentralResult,
  INDICADOR_CENTRAL_GRANULARITIES,
} from "../indicadorCentralContracts";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function ensureStringArray(value) {
  return ensureArray(value)
    .map((item) => ensureString(item))
    .filter(Boolean);
}

function normalizeCompanyOptionItem(item) {
  if (!isPlainObject(item)) return null;

  const id = toFiniteNumber(
    firstNonEmpty(item.id, item.empresa_id, item.empresaId, item.value),
    null
  );
  const label = ensureString(
    firstNonEmpty(
      item.nombre,
      item.name,
      item.label,
      item.empresa,
      item.nombre_empresa,
      item.nombreEmpresa,
      item.razon_social,
      item.razonSocial
    )
  );

  if (id === null || !label) return null;

  return {
    value: String(id),
    label,
  };
}

function toNullableString(value) {
  const normalized = ensureString(value);
  return normalized || null;
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "si", "sí", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  return fallback;
}

function toFiniteNumber(value, fallback = null) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return null;
}

function unwrapCandidate(payload) {
  if (!isPlainObject(payload)) return {};

  if (isPlainObject(payload.configuracion)) return payload.configuracion;
  if (isPlainObject(payload.resultado)) return payload.resultado;

  if (isPlainObject(payload.data)) {
    if (isPlainObject(payload.data.configuracion)) return payload.data.configuracion;
    if (isPlainObject(payload.data.resultado)) return payload.data.resultado;
    return payload.data;
  }

  return payload;
}

function normalizeScope(scope) {
  const fallback = createDefaultIndicadorCentralConfig().scope;
  const safeScope = isPlainObject(scope) ? scope : {};

  return {
    empresaIds: ensureArray(firstNonEmpty(safeScope.empresa_ids, safeScope.empresaIds, fallback.empresaIds))
      .map((item) => toFiniteNumber(item))
      .filter((item) => item !== null),
    obraId: toFiniteNumber(firstNonEmpty(safeScope.obra_id, safeScope.obraId), null),
    obraNombre: toNullableString(firstNonEmpty(safeScope.obra_nombre, safeScope.obraNombre)),
    segmentarPorObra: toBoolean(
      firstNonEmpty(safeScope.segmentar_por_obra, safeScope.segmentarPorObra),
      fallback.segmentarPorObra
    ),
    nombres: ensureStringArray(firstNonEmpty(safeScope.nombres, fallback.nombres)),
  };
}

function normalizeThresholds(thresholds) {
  const fallback = createDefaultIndicadorCentralConfig().umbrales;
  const safeThresholds = isPlainObject(thresholds) ? thresholds : {};

  return {
    alertaPct: toFiniteNumber(
      firstNonEmpty(safeThresholds.alerta_pct, safeThresholds.alertaPct),
      fallback.alertaPct
    ),
    objetivoPct: toFiniteNumber(
      firstNonEmpty(safeThresholds.objetivo_pct, safeThresholds.objetivoPct),
      fallback.objetivoPct
    ),
  };
}

function normalizeFormatsByCompany(formatsByCompany) {
  const fallback = createDefaultIndicadorCentralFormatsByCompany();
  const safeFormats = isPlainObject(formatsByCompany) ? formatsByCompany : {};
  const companyKeys = [...new Set([...Object.keys(fallback), ...Object.keys(safeFormats)])];

  return companyKeys.reduce((accumulator, companyKey) => {
    accumulator[companyKey] = ensureStringArray(firstNonEmpty(safeFormats[companyKey], fallback[companyKey]));
    return accumulator;
  }, {});
}

function normalizeGranularityValue(value) {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (["persona_dia", "persona_diaria", "persona_día", "diario", "daily"].includes(normalized)) {
    return INDICADOR_CENTRAL_GRANULARITIES.PERSONA_DIA;
  }

  if (["persona_unica_mensual", "persona_unica", "persona_única_mensual", "mensual", "monthly"].includes(normalized)) {
    return INDICADOR_CENTRAL_GRANULARITIES.PERSONA_UNICA_MENSUAL;
  }

  if (["mensual_acumulado", "monthly_accumulated"].includes(normalized)) {
    return INDICADOR_CENTRAL_GRANULARITIES.MENSUAL_ACUMULADO;
  }

  return null;
}

function padMonthDay(value) {
  return String(value).padStart(2, "0");
}

function getMonthDateRange(fechaCorte, includeWholeMonth = true) {
  const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(fechaCorte || "");
  if (!match) {
    return {
      fechaInicio: fechaCorte || "",
      fechaFin: fechaCorte || "",
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const lastDayOfMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthPrefix = `${year}-${padMonthDay(month)}`;

  return {
    fechaInicio: `${monthPrefix}-01`,
    fechaFin: includeWholeMonth ? `${monthPrefix}-${padMonthDay(lastDayOfMonth)}` : fechaCorte,
  };
}

export function detectIndicadorCentralGranularity(payload = {}) {
  const candidate = unwrapCandidate(payload);
  const directGranularity = normalizeGranularityValue(
    firstNonEmpty(
      candidate.granularidad,
      candidate.granularity,
      candidate.resumen?.granularidad,
      candidate.resumen?.granularity,
      candidate.ejecucion?.granularidad,
      candidate.ejecucion?.granularity
    )
  );

  if (directGranularity) return directGranularity;

  const inferredByCutType = normalizeGranularityValue(
    firstNonEmpty(candidate.corte_tipo, candidate.corteTipo, candidate.ejecucion?.corte_tipo)
  );

  return inferredByCutType || INDICADOR_CENTRAL_GRANULARITIES.DESCONOCIDA;
}

export function extractIndicadorCentralCutTypes(payload = {}) {
  const candidate = unwrapCandidate(payload);
  const sources = [
    candidate.tipos_corte_disponibles,
    candidate.tiposCorteDisponibles,
    candidate.supported_cut_types,
    candidate.supportedCutTypes,
    candidate.meta?.tipos_corte_disponibles,
    candidate.meta?.supported_cut_types,
  ];

  const values = sources.flatMap((source) => ensureStringArray(source));
  return [...new Set(values)];
}

export function normalizeIndicadorCentralCompanies(payload = {}) {
  const candidate = unwrapCandidate(payload);
  const sources = [
    candidate.empresas,
    candidate.data?.empresas,
    candidate.results,
    candidate.rows,
    candidate.items,
    candidate,
  ];

  const normalizedCompanies = sources
    .flatMap((source) => ensureArray(source))
    .map((item) => normalizeCompanyOptionItem(item))
    .filter(Boolean);

  const uniqueCompanies = new Map();

  normalizedCompanies.forEach((company) => {
    if (!uniqueCompanies.has(company.value)) {
      uniqueCompanies.set(company.value, company);
    }
  });

  return [...uniqueCompanies.values()].sort((left, right) => left.label.localeCompare(right.label, "es"));
}

export function normalizeIndicadorCentralConfig(payload = {}) {
  const fallback = createDefaultIndicadorCentralConfig();
  const candidate = unwrapCandidate(payload);

  return {
    destinatarios: ensureStringArray(firstNonEmpty(candidate.destinatarios, fallback.destinatarios)),
    umbrales: normalizeThresholds(firstNonEmpty(candidate.umbrales, fallback.umbrales)),
    formatosPorEmpresa: normalizeFormatsByCompany(
      firstNonEmpty(candidate.formatos_por_empresa, candidate.formatosPorEmpresa, fallback.formatosPorEmpresa)
    ),
    exclusiones: ensureStringArray(firstNonEmpty(candidate.exclusiones, fallback.exclusiones)),
    distribucionHabilitada: toBoolean(
      firstNonEmpty(candidate.distribucion_habilitada, candidate.distribucionHabilitada, fallback.distribucionHabilitada),
      fallback.distribucionHabilitada
    ),
    scope: normalizeScope(candidate.scope),
  };
}

export function toIndicadorCentralConfigPayload(config = {}, options = {}) {
  const normalizedConfig = normalizeIndicadorCentralConfig(config);
  const updatedBy = ensureString(options.updatedBy) || "panel.indicador_central";

  return {
    destinatarios: normalizedConfig.destinatarios,
    umbrales: {
      alerta_pct: normalizedConfig.umbrales.alertaPct,
      objetivo_pct: normalizedConfig.umbrales.objetivoPct,
    },
    formatos_por_empresa: normalizedConfig.formatosPorEmpresa,
    exclusiones: normalizedConfig.exclusiones,
    distribucion_habilitada: normalizedConfig.distribucionHabilitada,
    scope: {
      empresa_ids: normalizedConfig.scope.empresaIds,
      obra_id: normalizedConfig.scope.segmentarPorObra ? normalizedConfig.scope.obraId : null,
      obra_nombre: normalizedConfig.scope.segmentarPorObra ? normalizedConfig.scope.obraNombre : null,
      segmentar_por_obra: normalizedConfig.scope.segmentarPorObra,
      nombres: normalizedConfig.scope.nombres,
    },
    updated_by: updatedBy,
  };
}

export function normalizeIndicadorCentralExecution(payload = {}) {
  const defaults = createDefaultIndicadorCentralExecution();
  const safePayload = isPlainObject(payload) ? payload : {};

  return {
    fechaCorte: ensureString(firstNonEmpty(safePayload.fecha_corte, safePayload.fechaCorte)) || defaults.fechaCorte,
    corteTipo: ensureString(firstNonEmpty(safePayload.corte_tipo, safePayload.corteTipo)) || defaults.corteTipo,
    nombre: ensureString(firstNonEmpty(safePayload.nombre, safePayload.name)) || defaults.nombre,
  };
}

export function normalizeIndicadorCentralDownloadRequest(payload = {}) {
  const defaults = createDefaultIndicadorCentralDownloadRequest();
  const safePayload = isPlainObject(payload) ? payload : {};

  return {
    nombre: ensureString(firstNonEmpty(safePayload.nombre, safePayload.name)) || defaults.nombre,
    fechaInicio: ensureString(firstNonEmpty(safePayload.fecha_inicio, safePayload.fechaInicio)) || defaults.fechaInicio,
    fechaFin: ensureString(firstNonEmpty(safePayload.fecha_fin, safePayload.fechaFin)) || defaults.fechaFin,
    corteTipo: ensureString(firstNonEmpty(safePayload.corte_tipo, safePayload.corteTipo)) || defaults.corteTipo,
    limit: toFiniteNumber(firstNonEmpty(safePayload.limit, safePayload.limite), defaults.limit),
  };
}

export function buildIndicadorCentralWorkbookFallbackRequest(execution = {}, options = {}) {
  const normalizedExecution = normalizeIndicadorCentralExecution(execution);
  const includeWholeMonth = false;
  const range =
    normalizedExecution.corteTipo === "mensual" || normalizedExecution.corteTipo === "mensual_acumulado"
      ? getMonthDateRange(normalizedExecution.fechaCorte, includeWholeMonth)
      : {
          fechaInicio: normalizedExecution.fechaCorte,
          fechaFin: normalizedExecution.fechaCorte,
        };

  return normalizeIndicadorCentralDownloadRequest({
    nombre: ensureString(options.nombre ?? normalizedExecution.nombre),
    fecha_inicio: range.fechaInicio,
    fecha_fin: range.fechaFin,
    corte_tipo: normalizedExecution.corteTipo,
    limit: toFiniteNumber(options.limit, 10000) ?? 10000,
  });
}

export function toIndicadorCentralDownloadPayload(request = {}) {
  const normalizedRequest = normalizeIndicadorCentralDownloadRequest(request);

  return {
    nombre: normalizedRequest.nombre,
    fecha_inicio: normalizedRequest.fechaInicio,
    fecha_fin: normalizedRequest.fechaFin,
    limit: normalizedRequest.limit || 10000,
    corte_tipo: normalizedRequest.corteTipo,
  };
}

export function normalizeIndicadorCentralExecutionResponse(payload = {}) {
  const fallback = createDefaultIndicadorCentralResult();
  const candidate = unwrapCandidate(payload);
  const resumen = firstNonEmpty(candidate.resumen, candidate.summary);

  return {
    ...fallback,
    success: toBoolean(firstNonEmpty(candidate.success, candidate.ok), fallback.success),
    alreadyProcessed: toBoolean(
      firstNonEmpty(candidate.already_processed, candidate.alreadyProcessed),
      fallback.alreadyProcessed
    ),
    snapshotBatchId: firstNonEmpty(
      candidate.snapshot_batch_id,
      candidate.snapshotBatchId,
      candidate.snapshot?.batch_id
    ),
    resumen: isPlainObject(resumen) || Array.isArray(resumen) ? resumen : null,
    granularidad: detectIndicadorCentralGranularity(candidate),
    estado: firstNonEmpty(candidate.ejecucion?.estado, candidate.estado, candidate.status),
    errorMessage: firstNonEmpty(
      candidate.ejecucion?.error_message,
      candidate.ejecucion?.errorMessage,
      candidate.error_message,
      candidate.errorMessage,
      candidate.error,
      !toBoolean(firstNonEmpty(candidate.success, candidate.ok), fallback.success)
        ? candidate.message
        : null
    ),
    workbookUrl: null,
    workbookFileName: null,
    workbookAvailable: false,
  };
}

