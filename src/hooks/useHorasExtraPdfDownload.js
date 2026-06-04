import { useCallback } from "react";
import { useHorasExtraPdfJob } from "../components/compartido/HorasExtraPdfJobContext";
import { buildHorasExtraPdfDownloadBody } from "../utils/horasExtraReportDownload";

export function useHorasExtraPdfDownload({
  buildRequestBody = buildHorasExtraPdfDownloadBody,
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

  const downloadPdf = useCallback(
    async (filters = {}) => {
      return startGlobalHorasExtraPdfDownload({
        filters,
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

  return {
    downloadPdf,
    downloadReadyFile,
    retryLastDownload,
    clearState,
    state,
  };
}

export default useHorasExtraPdfDownload;
