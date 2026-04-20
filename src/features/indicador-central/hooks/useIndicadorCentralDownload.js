import { useCallback, useState } from "react";
import {
  buildIndicadorCentralWorkbookFallbackRequest,
  toIndicadorCentralDownloadPayload,
} from "../adapters/indicadorCentralAdapter";
import { downloadIndicadorCentralWorkbook } from "../services/indicadorCentralService";

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
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

function sanitizeFileNameSegment(value) {
  return String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveFallbackFileName(response, request) {
  const contentDisposition = response?.headers?.["content-disposition"];
  const utf8FileNameMatch = contentDisposition?.match(/filename\*=UTF-8''([^;\n]*)/i);
  if (utf8FileNameMatch?.[1]) {
    return decodeURIComponent(utf8FileNameMatch[1]);
  }

  const fileNameMatch = contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
  if (fileNameMatch?.[1]) {
    return fileNameMatch[1].replace(/['"]/g, "");
  }

  const fileNameSegments = ["indicador-central", request?.corteTipo];

  if (request?.fechaInicio && request?.fechaFin && request.fechaInicio !== request.fechaFin) {
    fileNameSegments.push(request.fechaInicio, "a", request.fechaFin);
  } else if (request?.fechaInicio) {
    fileNameSegments.push(request.fechaInicio);
  }

  if (request?.nombre) {
    fileNameSegments.push(request.nombre);
  }

  return `${fileNameSegments.map(sanitizeFileNameSegment).filter(Boolean).join("-")}.xlsx`;
}

async function throwIfBlobContainsError(response) {
  const blob = response?.data;
  if (!(blob instanceof Blob)) return;
  if (!blob.type?.includes("application/json")) return;

  const text = await blob.text();

  let payload = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = null;
  }

  throw new Error(payload?.message || payload?.error || text || "No se pudo descargar el workbook.");
}

export function useIndicadorCentralDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [lastDownloadedAt, setLastDownloadedAt] = useState(null);
  const [lastFileName, setLastFileName] = useState(null);

  const downloadWorkbook = useCallback(async (execution = {}) => {
    setDownloading(true);
    setError(null);

    try {
      const requestToSend = buildIndicadorCentralWorkbookFallbackRequest(execution, {
        nombre: execution?.nombre,
      });
      const response = await downloadIndicadorCentralWorkbook(
        toIndicadorCentralDownloadPayload(requestToSend)
      );
      await throwIfBlobContainsError(response);

      const fileName = resolveFallbackFileName(response, requestToSend);
      triggerBrowserDownload(response.data, fileName);
      setLastDownloadedAt(new Date().toISOString());
      setLastFileName(fileName);
      return {
        request: requestToSend,
        fileName,
      };
    } catch (requestError) {
      const normalizedError = getErrorMessage(
        requestError,
        "No se pudo descargar el workbook."
      );
      setError(normalizedError);
      throw requestError;
    } finally {
      setDownloading(false);
    }
  }, []);

  return {
    downloading,
    error,
    lastDownloadedAt,
    lastFileName,
    downloadWorkbook,
    clearError: () => setError(null),
  };
}

export default useIndicadorCentralDownload;
