import api from "./api";

const DEFAULT_PDF_FILE_NAME = "horas_jornada.pdf";
const DEFAULT_XLSX_FILE_NAME = "horas_jornada.xlsx";
const DEFAULT_POLL_INTERVAL_MS = 3000;
const DEFAULT_REQUEST_TIMEOUT_MS = 45000;
const DEFAULT_ERROR_MESSAGE =
  "No se pudo generar el reporte de horas extra. Intentá nuevamente.";

function sanitizeFileNameSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeReportFormat(reportFormat = "pdf") {
  const format = String(reportFormat || "pdf").trim().toLowerCase();
  return format === "excel" || format === "xlsx" ? "excel" : "pdf";
}

function getDefaultFileName(reportFormat = "pdf") {
  return normalizeReportFormat(reportFormat) === "excel"
    ? DEFAULT_XLSX_FILE_NAME
    : DEFAULT_PDF_FILE_NAME;
}

function normalizeDownloadedFileName(fileName, reportFormat = "pdf") {
  const normalizedFormat = normalizeReportFormat(reportFormat);
  const safeFileName = String(fileName || "").trim();
  const defaultName = getDefaultFileName(normalizedFormat);

  if (!safeFileName) {
    return defaultName;
  }

  const baseNameMatch = safeFileName.match(/^(.*?)(\.[^.]+)?$/);
  const baseName = baseNameMatch?.[1] || safeFileName;

  if (normalizedFormat === "excel") {
    return `${baseName}.xlsx`;
  }

  return `${baseName}.pdf`;
}

function triggerBrowserDownload(blobData, fileName) {
  if (typeof window === "undefined") return;

  const blob = blobData instanceof Blob ? blobData : new Blob([blobData]);
  const blobUrl = window.URL.createObjectURL(blob);
  const link = window.document.createElement("a");

  link.href = blobUrl;
  link.download = fileName;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

function extractFileName(response, fallbackFileName) {
  const contentDisposition = response?.headers?.["content-disposition"] || "";
  const utf8Match = contentDisposition.match(
    /filename\*=UTF-8''([^;\n]*)/i,
  );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const match = contentDisposition.match(
    /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i,
  );

  if (match?.[1]) {
    return match[1].replace(/['"]/g, "");
  }

  return fallbackFileName;
}

async function readBlobPayload(blob) {
  if (!(blob instanceof Blob)) return null;

  try {
    const text = await blob.text();
    if (!text?.trim()) return null;

    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeBackendPath(path) {
  const rawPath = String(path || "").trim();
  if (!rawPath) return "";

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  const baseUrl = String(api?.defaults?.baseURL || "").trim();
  if (!baseUrl) return rawPath;

  try {
    const basePath = new URL(baseUrl).pathname.replace(/\/+$/, "");
    if (basePath && basePath !== "/" && rawPath.startsWith(`${basePath}/`)) {
      return rawPath.slice(basePath.length);
    }

    if (basePath && basePath !== "/" && rawPath === basePath) {
      return "/";
    }
  } catch {
    // Ignore parsing issues and use the raw path.
  }

  return rawPath;
}

function getReadableAxiosMessage(error, fallbackMessage) {
  if (error?.code === "ERR_CANCELED" || error?.name === "AbortError") {
    return "La descarga fue cancelada.";
  }

  if (error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "")) {
    return "La generación tardó demasiado. Podés reintentar.";
  }

  const responseData = error?.response?.data;

  if (responseData instanceof Blob) {
    return responseData
      .text()
      .then((text) => {
        try {
          const payload = JSON.parse(text);
          return (
            payload?.message ||
            payload?.error ||
            text ||
            fallbackMessage ||
            DEFAULT_ERROR_MESSAGE
          );
        } catch {
          return text || fallbackMessage || DEFAULT_ERROR_MESSAGE;
        }
      })
      .catch(() => error?.message || fallbackMessage || DEFAULT_ERROR_MESSAGE);
  }

  return Promise.resolve(
    error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      fallbackMessage ||
      DEFAULT_ERROR_MESSAGE,
  );
}

function resolveStatusMessage(status, fallbackMessage = "") {
  switch (status) {
    case "pending":
      return fallbackMessage || "Solicitud recibida";
    case "processing":
      return fallbackMessage || "Generando reporte";
    case "ready":
      return fallbackMessage || "El reporte está listo para descargar.";
    case "error":
    case "failed":
      return fallbackMessage || "No se pudo generar el reporte.";
    default:
      return fallbackMessage || "Generando reporte de horas extra...";
  }
}

function normalizeJobStatus(payload, fallbackJob = {}) {
  const status = String(payload?.status || fallbackJob?.status || "")
    .trim()
    .toLowerCase();

  const reportFormat = normalizeReportFormat(
    payload?.reportFormat || payload?.format || fallbackJob?.reportFormat || fallbackJob?.format || "pdf",
  );

  return {
    jobId: String(payload?.jobId || fallbackJob?.jobId || "").trim(),
    status: status || "pending",
    reportFormat,
    message:
      payload?.message ||
      fallbackJob?.message ||
      resolveStatusMessage(status || "pending"),
    statusUrl: normalizeBackendPath(
      payload?.statusUrl || fallbackJob?.statusUrl || "",
    ),
    downloadUrl: normalizeBackendPath(
      payload?.downloadUrl || fallbackJob?.downloadUrl || "",
    ),
    raw: payload || null,
  };
}

function buildHorasExtraReportRequestBody(filters = {}, reportFormat = "pdf") {
  const format = normalizeReportFormat(reportFormat);

  return {
    nombre: filters.nombre || "",
    obra: filters.obra || "",
    constructora: filters.constructora || "",
    empresa_id: Number(filters.empresa_id) || 1,
    fecha_inicio: filters.fecha_inicio || "",
    fecha_fin: filters.fecha_fin || "",
    formato: format,
    modo: "job",
  };
}

async function postBlob(
  client,
  url,
  body,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  signal,
) {
  return client.post(url, body, {
    responseType: "blob",
    timeout: timeoutMs,
    signal,
  });
}

async function getBlob(
  client,
  url,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  signal,
) {
  return client.get(url, {
    responseType: "blob",
    timeout: timeoutMs,
    signal,
  });
}

async function requestHorasExtraReportStart(
  client,
  requestBody,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  signal,
) {
  const response = await postBlob(
    client,
    "/administrador/admin_horas_extra/report-jobs",
    requestBody,
    timeoutMs,
    signal,
  );

  const contentType = String(
    response?.headers?.["content-type"] || "",
  ).toLowerCase();
  const payload = await readBlobPayload(response?.data);
  const requestedFormat = normalizeReportFormat(requestBody?.formato || "pdf");

  if (payload && typeof payload === "object") {
    const normalizedJob = normalizeJobStatus(payload, {
      reportFormat: requestedFormat,
    });

    if (normalizedJob.jobId) {
      return {
        kind: "job",
        job: normalizedJob,
        response,
      };
    }

    throw new Error(
      payload?.message ||
        payload?.error ||
        "No se pudo iniciar la generacion del reporte.",
    );
  }

  if (
    contentType.includes("application/pdf") ||
    contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
    contentType.includes("octet-stream") ||
    response?.data instanceof Blob
  ) {
    return {
      kind: "file",
      fileName: extractFileName(response, getDefaultFileName(requestedFormat)),
      response,
    };
  }

  throw new Error("La respuesta del servidor no fue compatible con la descarga.");
}

export async function getHorasExtraReportJobStatus(
  jobId,
  {
    client = api,
    statusUrl,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    signal,
  } = {},
) {
  const normalizedStatusUrl = normalizeBackendPath(statusUrl);
  const url =
    normalizedStatusUrl ||
    `/administrador/admin_horas_extra/pdf-jobs/${encodeURIComponent(jobId)}`;

  const response = await client.get(url, {
    timeout: timeoutMs,
    signal,
  });

  const payload = response?.data || {};
  return normalizeJobStatus(payload, { jobId, statusUrl: url });
}

export async function downloadHorasExtraReportJobFile(
  jobId,
  {
    client = api,
    downloadUrl,
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    fallbackFileName = DEFAULT_PDF_FILE_NAME,
    reportFormat = "pdf",
    signal,
  } = {},
) {
  const normalizedDownloadUrl = normalizeBackendPath(downloadUrl);
  const url =
    normalizedDownloadUrl ||
    `/administrador/admin_horas_extra/pdf-jobs/${encodeURIComponent(jobId)}/download`;

  const response = await getBlob(client, url, timeoutMs, signal);
  const payload = await readBlobPayload(response?.data);

  if (payload && typeof payload === "object") {
    throw new Error(
      payload?.message ||
        payload?.error ||
        "No se pudo descargar el reporte generado.",
    );
  }

  const extractedFileName = extractFileName(response, fallbackFileName);
  const fileName = normalizeDownloadedFileName(extractedFileName, reportFormat);
  triggerBrowserDownload(response?.data, fileName);
  return {
    fileName,
    response,
  };
}

export async function downloadHorasExtraReport(
  filters = {},
  {
    client = api,
    reportFormat = "pdf",
    buildRequestBody = buildHorasExtraReportRequestBody,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    statusTimeoutMs = 10000,
    maxPollAttempts = 120,
    onProgress,
    signal,
  } = {},
) {
  const normalizedReportFormat = normalizeReportFormat(reportFormat);
  const requestBody = buildRequestBody(filters, normalizedReportFormat);

  const emitProgress = (nextState) => {
    if (typeof onProgress === "function") {
      onProgress(nextState);
    }
  };

  emitProgress({
    status: "starting",
    message: "Generando reporte de horas extra...",
    reportFormat: normalizedReportFormat,
  });

  try {
    if (signal?.aborted) {
      throw new Error("La descarga fue cancelada.");
    }

    const startResult = await requestHorasExtraReportStart(
      client,
      requestBody,
      requestTimeoutMs,
      signal,
    );

    if (startResult.kind === "file") {
      triggerBrowserDownload(startResult.response?.data, startResult.fileName);
      emitProgress({
        status: "done",
        message: "El reporte se descargó correctamente.",
        fileName: startResult.fileName,
        reportFormat: normalizedReportFormat,
      });
      return {
        kind: "file",
        fileName: startResult.fileName,
      };
    }

    let currentJob = startResult.job;
    let pollAttempts = 0;

    emitProgress({
      status: currentJob.status,
      jobId: currentJob.jobId,
      message: resolveStatusMessage(currentJob.status, currentJob.message),
      statusUrl: currentJob.statusUrl,
      downloadUrl: currentJob.downloadUrl,
      reportFormat: currentJob.reportFormat || normalizedReportFormat,
    });

    while (true) {
      if (signal?.aborted) {
        throw new Error("La descarga fue cancelada.");
      }

      pollAttempts += 1;
      if (pollAttempts > maxPollAttempts) {
        throw new Error(
          "No se pudo confirmar el estado del reporte a tiempo. Intentá nuevamente.",
        );
      }

      let statusResult;
      try {
        statusResult = await getHorasExtraReportJobStatus(currentJob.jobId, {
          client,
          statusUrl: currentJob.statusUrl,
          timeoutMs: statusTimeoutMs,
          signal,
        });
      } catch (pollError) {
        if (
          pollError?.code === "ECONNABORTED" ||
          /timeout/i.test(pollError?.message || "")
        ) {
          emitProgress({
            status: currentJob.status || "pending",
            jobId: currentJob.jobId,
            message: "El reporte sigue generándose...",
            statusUrl: currentJob.statusUrl,
            downloadUrl: currentJob.downloadUrl,
            reportFormat: currentJob.reportFormat || normalizedReportFormat,
          });

          await new Promise((resolve) => {
            setTimeout(resolve, pollIntervalMs);
          });
          continue;
        }

        throw pollError;
      }

      currentJob = {
        ...currentJob,
        ...statusResult,
      };

      const resolvedMessage = resolveStatusMessage(
        currentJob.status,
        currentJob.message,
      );

      emitProgress({
        status: currentJob.status,
        jobId: currentJob.jobId,
        message: resolvedMessage,
        statusUrl: currentJob.statusUrl,
        downloadUrl: currentJob.downloadUrl,
        reportFormat: currentJob.reportFormat || normalizedReportFormat,
      });

      if (currentJob.status === "ready") {
        return {
          kind: "job-ready",
          jobId: currentJob.jobId,
          statusUrl: currentJob.statusUrl,
          downloadUrl: currentJob.downloadUrl,
          message: resolvedMessage,
          reportFormat: currentJob.reportFormat || normalizedReportFormat,
        };
      }

      if (currentJob.status === "error" || currentJob.status === "failed") {
        throw new Error(resolvedMessage || DEFAULT_ERROR_MESSAGE);
      }

      if (signal?.aborted) {
        throw new Error("La descarga fue cancelada.");
      }

      await new Promise((resolve) => {
        setTimeout(resolve, pollIntervalMs);
      });
    }
  } catch (error) {
    const readableMessage = await getReadableAxiosMessage(
      error,
      DEFAULT_ERROR_MESSAGE,
    );

    emitProgress({
      status: "error",
      message: readableMessage,
      error,
      reportFormat: normalizedReportFormat,
    });

    const normalizedError =
      error instanceof Error ? error : new Error(readableMessage);
    normalizedError.message = readableMessage;
    throw normalizedError;
  }
}

export async function downloadHorasExtraPdfReport(filters = {}, options = {}) {
  return downloadHorasExtraReport(filters, {
    ...options,
    reportFormat: "pdf",
  });
}

export async function downloadHorasExtraExcelReport(
  filters = {},
  options = {},
) {
  return downloadHorasExtraReport(filters, {
    ...options,
    reportFormat: "excel",
  });
}

export function buildHorasExtraReportDownloadBody(
  filters = {},
  reportFormat = "pdf",
) {
  return buildHorasExtraReportRequestBody(filters, reportFormat);
}

export function buildHorasExtraPdfDownloadBody(filters = {}) {
  return buildHorasExtraReportRequestBody(filters, "pdf");
}

export function buildHorasExtraExcelDownloadBody(filters = {}) {
  return buildHorasExtraReportRequestBody(filters, "excel");
}

function buildHorasExtraReportFileName(
  request = {},
  reportFormat = "pdf",
) {
  const segments = ["horas", "jornada"];

  if (request?.fecha_inicio) {
    segments.push(request.fecha_inicio);
  }

  if (request?.fecha_fin && request?.fecha_fin !== request?.fecha_inicio) {
    segments.push("a", request.fecha_fin);
  }

  if (request?.nombre) {
    segments.push(request.nombre);
  }

  const extension = normalizeReportFormat(reportFormat) === "excel" ? "xlsx" : "pdf";

  return `${segments
    .map(sanitizeFileNameSegment)
    .filter(Boolean)
    .join("-")}.${extension}`;
}

export function buildHorasExtraPdfFileName(request = {}) {
  return buildHorasExtraReportFileName(request, "pdf");
}

export function buildHorasExtraExcelFileName(request = {}) {
  return buildHorasExtraReportFileName(request, "excel");
}
