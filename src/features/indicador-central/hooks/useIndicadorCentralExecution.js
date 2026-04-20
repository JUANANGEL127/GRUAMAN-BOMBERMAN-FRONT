import { useCallback, useMemo, useState } from "react";
import {
  extractIndicadorCentralCutTypes,
  normalizeIndicadorCentralExecution,
} from "../adapters/indicadorCentralAdapter";
import {
  createDefaultIndicadorCentralExecution,
  INDICADOR_CENTRAL_DEFAULT_CUT_TYPES,
} from "../indicadorCentralContracts";

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

function mergeSupportedCutTypes(currentCutTypes, incomingPayload) {
  const discoveredCutTypes = extractIndicadorCentralCutTypes(incomingPayload);
  if (!discoveredCutTypes.length) return currentCutTypes;
  return [...new Set([...currentCutTypes, ...discoveredCutTypes])];
}

export function useIndicadorCentralExecution(options = {}) {
  const [execution, setExecution] = useState(() =>
    normalizeIndicadorCentralExecution(options.initialExecution || createDefaultIndicadorCentralExecution())
  );
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [lastExecutedAt, setLastExecutedAt] = useState(null);
  const [lastFileName, setLastFileName] = useState(null);
  const [supportedCutTypes, setSupportedCutTypes] = useState(() => {
    const discoveredCutTypes = extractIndicadorCentralCutTypes({
      tipos_corte_disponibles: options.supportedCutTypes,
    });

    return discoveredCutTypes.length ? discoveredCutTypes : [...INDICADOR_CENTRAL_DEFAULT_CUT_TYPES];
  });

  const syncSupportedCutTypes = useCallback((payload) => {
    setSupportedCutTypes((currentCutTypes) => mergeSupportedCutTypes(currentCutTypes, payload));
  }, []);

  const setExecutionField = useCallback((field, value) => {
    setExecution((currentExecution) =>
      normalizeIndicadorCentralExecution({
        ...currentExecution,
        [field]: value,
      })
    );
  }, []);

  const runExecution = useCallback(
    async (downloadAction, nextExecution = execution) => {
      if (typeof downloadAction !== "function") {
        throw new Error("Download action is required.");
      }

      setDownloading(true);
      setError(null);

      try {
        const normalizedExecution = normalizeIndicadorCentralExecution(nextExecution);
        const downloadResult = await downloadAction(normalizedExecution);
        setExecution(normalizedExecution);
        setLastExecutedAt(new Date().toISOString());
        setLastFileName(downloadResult?.fileName || null);
        return downloadResult;
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
    },
    [execution]
  );

  const canExecute = useMemo(
    () => Boolean(execution.fechaCorte && execution.corteTipo && !downloading),
    [execution.corteTipo, execution.fechaCorte, downloading]
  );

  return {
    execution,
    setExecution,
    setExecutionField,
    downloading,
    submitting: downloading,
    error,
    canExecute,
    supportedCutTypes,
    lastExecutedAt,
    lastFileName,
    syncSupportedCutTypes,
    runExecution,
    clearError: () => setError(null),
  };
}

export default useIndicadorCentralExecution;
