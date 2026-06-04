import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HorasExtraPdfJobContext } from "./HorasExtraPdfJobContext";
import ReportDownloadStatusCard from "./ReportDownloadStatusCard";
import { useAuth } from "../../features/auth/hooks/useAuth";
import {
  downloadHorasExtraPdfJobFile,
  downloadHorasExtraPdfReport,
} from "../../utils/horasExtraReportDownload";

const INITIAL_STATE = {
  visible: false,
  status: "idle",
  message: "",
  jobId: "",
  downloadUrl: "",
  statusUrl: "",
  fileName: "",
  error: null,
};

const TERMINAL_STATUSES = new Set(["ready", "done", "error", "failed"]);

function normalizeState(nextState = {}) {
  return {
    visible: nextState.visible ?? true,
    status: nextState.status || "idle",
    message: normalizeMessage(nextState.message),
    jobId: nextState.jobId || "",
    downloadUrl: nextState.downloadUrl || "",
    statusUrl: nextState.statusUrl || "",
    fileName: nextState.fileName || "",
    error: nextState.error || null,
  };
}

function normalizeClearState() {
  return INITIAL_STATE;
}

function normalizeMessage(value) {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || "";

  if (value && typeof value === "object") {
    if (typeof value.message === "string") return value.message;

    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }

  return value ? String(value) : "";
}

function resolveVisible(prevVisible, nextState) {
  if (Object.prototype.hasOwnProperty.call(nextState, "visible")) {
    return Boolean(nextState.visible);
  }

  const nextStatus = String(nextState?.status || "").trim().toLowerCase();
  if (TERMINAL_STATUSES.has(nextStatus)) {
    return true;
  }

  return Boolean(prevVisible);
}

export function HorasExtraPdfJobProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState(INITIAL_STATE);
  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);
  const lastRequestRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    console.log("[HorasExtraPdfJobProvider] effect mount");
    return () => {
      console.log("[HorasExtraPdfJobProvider] effect unmount");
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const updateState = useCallback((nextState) => {
    console.log("[HorasExtraPdfJobProvider] updateState called", {
      mounted: mountedRef.current,
      nextState,
    });
    if (!mountedRef.current) return;
    setState((prev) => {
      const next = normalizeState({
        ...prev,
        ...nextState,
        visible: resolveVisible(prev.visible, nextState),
      });
      console.log("[HorasExtraPdfJobProvider] state update", {
        prevStatus: prev?.status,
        nextStatus: next.status,
        prevVisible: prev?.visible,
        nextVisible: next.visible,
        nextState,
      });
      return next;
    });
  }, []);

  const clearState = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    activeRequestIdRef.current += 1;
    lastRequestRef.current = null;
    setState(normalizeClearState());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      clearState();
    }
  }, [clearState, isAuthenticated]);

  const dismissCard = useCallback(() => {
    setState((prev) =>
      normalizeState({
        ...prev,
        visible: false,
      }),
    );
  }, []);

  const downloadReadyFile = useCallback(async () => {
    if (!state.jobId) return null;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;

    updateState({
      visible: true,
      status: "processing",
      message: "Descargando PDF final...",
      error: null,
    });

    try {
      const result = await downloadHorasExtraPdfJobFile(state.jobId, {
        downloadUrl: state.downloadUrl || undefined,
        fallbackFileName: state.fileName || undefined,
        timeoutMs: lastRequestRef.current?.requestTimeoutMs || 45000,
        signal: abortControllerRef.current.signal,
      });

      if (requestId !== activeRequestIdRef.current) return result;

      updateState({
        visible: false,
        status: "done",
        message: "El PDF se descargó correctamente.",
        jobId: state.jobId,
        downloadUrl: state.downloadUrl,
        statusUrl: state.statusUrl,
        fileName: result.fileName || state.fileName || "",
        error: null,
      });

      return result;
    } catch (error) {
      if (requestId !== activeRequestIdRef.current) {
        throw error;
      }

      console.error("[horas-extra-pdf] ready file download error", error);

      updateState({
        visible: true,
        status: "error",
        message:
          error?.message ||
          "No se pudo descargar el PDF generado. Intentá nuevamente.",
        error,
        jobId: state.jobId,
        downloadUrl: state.downloadUrl,
        statusUrl: state.statusUrl,
        fileName: state.fileName,
      });

      throw error;
    }
  }, [state, updateState]);

  const startHorasExtraPdfDownload = useCallback(
    async ({
      filters = {},
      buildRequestBody,
      pollIntervalMs = 3000,
      requestTimeoutMs = 45000,
      statusTimeoutMs = 10000,
      maxPollAttempts = 120,
    } = {}) => {
      console.debug("[horas-extra-pdf] start request", { filters });

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const requestId = activeRequestIdRef.current + 1;
      activeRequestIdRef.current = requestId;
      lastRequestRef.current = {
        filters,
        buildRequestBody,
        pollIntervalMs,
        requestTimeoutMs,
        statusTimeoutMs,
        maxPollAttempts,
      };

      updateState({
        visible: true,
        status: "starting",
        message: "Generando reporte de horas extra...",
        jobId: "",
        downloadUrl: "",
        statusUrl: "",
        fileName: "",
        error: null,
      });

      try {
        const result = await downloadHorasExtraPdfReport(filters, {
          buildRequestBody,
          pollIntervalMs,
          requestTimeoutMs,
          statusTimeoutMs,
          maxPollAttempts,
          signal: abortControllerRef.current.signal,
    onProgress: (nextProgress) => {
            if (requestId !== activeRequestIdRef.current) return;

            console.debug("[horas-extra-pdf] progress", nextProgress);

            updateState({
              ...nextProgress,
              error: nextProgress.error || null,
            });
          },
        });

        if (requestId !== activeRequestIdRef.current) return result;

        if (result?.kind === "job-ready") {
          updateState({
            visible: true,
            status: "ready",
            message: result.message || "PDF listo para descargar.",
            jobId: result.jobId || "",
            statusUrl: result.statusUrl || "",
            downloadUrl: result.downloadUrl || "",
            fileName: "",
            error: null,
          });
        } else if (result?.kind === "file") {
          updateState({
            visible: false,
            status: "done",
            message: "El PDF se descargó correctamente.",
            fileName: result.fileName || "",
            error: null,
          });
        }

        return result;
      } catch (error) {
        if (requestId !== activeRequestIdRef.current) {
          throw error;
        }

        console.error("[horas-extra-pdf] download error", error);

        updateState({
          visible: true,
          status: "error",
          message:
            error?.message ||
            "No se pudo generar el reporte de horas extra. Intentá nuevamente.",
          error,
        });

        throw error;
      }
    },
    [updateState],
  );

  const retryLastDownload = useCallback(async () => {
    if (!lastRequestRef.current) return null;
    return startHorasExtraPdfDownload(lastRequestRef.current);
  }, [startHorasExtraPdfDownload]);

  const contextValue = useMemo(
    () => ({
      state,
      startHorasExtraPdfDownload,
      downloadReadyFile,
      retryLastDownload,
      clearState,
    }),
    [clearState, downloadReadyFile, retryLastDownload, startHorasExtraPdfDownload, state],
  );

  console.log("[HorasExtraPdfJobProvider] render", {
    status: state.status,
    visible: state.visible,
    jobId: state.jobId,
  });

  return (
    <HorasExtraPdfJobContext.Provider value={contextValue}>
      {children}
      {state.visible && state.status !== "idle" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483647,
            pointerEvents: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: "16px",
            overflowY: "auto",
          }}
        >
          <div style={{ pointerEvents: "auto" }}>
            <ReportDownloadStatusCard
              status={state.status}
              message={state.message}
              onRetry={retryLastDownload}
              onDownloadNow={downloadReadyFile}
              onDismiss={dismissCard}
            />
          </div>
        </div>
      )}
    </HorasExtraPdfJobContext.Provider>
  );
}
