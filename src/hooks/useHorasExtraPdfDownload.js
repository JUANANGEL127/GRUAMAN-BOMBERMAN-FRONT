import { useCallback } from "react";
import { useHorasExtraPdfJob } from "../components/compartido/HorasExtraPdfJobContext";
import {
  buildHorasExtraReportDownloadBody,
} from "../utils/horasExtraReportDownload";

export function useHorasExtraPdfDownload({
  buildRequestBody = buildHorasExtraReportDownloadBody,
  pollIntervalMs = 3000,
  requestTimeoutMs = 45000,
  statusTimeoutMs = 10000,
  maxPollAttempts = 120,
} = {}) {
  const {
    state,
    startHorasExtraPdfDownload: startGlobalHorasExtraPdfDownload,
    downloadReadyFile,
    retryLastDownload,
    clearState,
  } = useHorasExtraPdfJob();

  const downloadReport = useCallback(
    async (filters = {}, reportFormat = "pdf") => {
      return startGlobalHorasExtraPdfDownload({
        filters,
        reportFormat,
        buildRequestBody,
        pollIntervalMs,
        requestTimeoutMs,
        statusTimeoutMs,
        maxPollAttempts,
      });
    },
    [
      buildRequestBody,
      maxPollAttempts,
      pollIntervalMs,
      requestTimeoutMs,
      startGlobalHorasExtraPdfDownload,
      statusTimeoutMs,
    ],
  );

  const downloadPdf = useCallback(
    async (filters = {}) => downloadReport(filters, "pdf"),
    [downloadReport],
  );

  const downloadExcel = useCallback(
    async (filters = {}) => downloadReport(filters, "excel"),
    [downloadReport],
  );

  return {
    downloadReport,
    downloadPdf,
    downloadExcel,
    downloadReadyFile,
    retryLastDownload,
    clearState,
    state,
  };
}

export default useHorasExtraPdfDownload;
