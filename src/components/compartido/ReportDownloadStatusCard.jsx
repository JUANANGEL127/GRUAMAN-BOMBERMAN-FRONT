import React from "react";

function getCardStyles(status) {
  if (status === "error") {
    return {
      background: "#fff1f1",
      border: "1px solid #f2b8b5",
      color: "#8a1f17",
    };
  }

  if (status === "ready" || status === "done") {
    return {
      background: "#eefbf2",
      border: "1px solid #bfe8c8",
      color: "#165b2b",
    };
  }

  return {
    background: "#edf6ff",
    border: "1px solid #b8d7f5",
    color: "#114b8b",
  };
}

function getStatusLabel(status, reportFormat = "pdf") {
  const isExcel = String(reportFormat || "pdf").trim().toLowerCase() === "excel";

  switch (status) {
    case "starting":
      return "Generando reporte...";
    case "pending":
      return "Solicitud recibida";
    case "processing":
      return isExcel ? "Generando Excel" : "Generando PDF";
    case "ready":
      return isExcel ? "Excel listo" : "PDF listo";
    case "done":
      return "Descarga completada";
    case "error":
      return "Error";
    default:
      return "Reporte de horas extra";
  }
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

function ReportDownloadStatusCard({
  status = "idle",
  message = "",
  reportFormat = "pdf",
  onRetry,
  onDownloadNow,
  onDismiss,
}) {
  if (!status || status === "idle") {
    return null;
  }

  const styles = getCardStyles(status);
  const safeMessage = normalizeMessage(message);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        width: "min(100vw - 24px, 460px)",
        maxWidth: "calc(100vw - 24px)",
        ...styles,
        borderRadius: 12,
        padding: "16px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.14)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar notificación de descarga"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            border: "none",
            background: "rgba(255,255,255,0.7)",
            color: "inherit",
            cursor: "pointer",
            width: 28,
            height: 28,
            borderRadius: 999,
            fontSize: 18,
            lineHeight: 1,
            padding: 0,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          ×
        </button>
      )}

      <div style={{ minWidth: 0, paddingRight: onDismiss ? 34 : 0 }}>
        <div
          style={{
            fontWeight: 700,
            marginBottom: 4,
            fontSize: "clamp(17px, 4.4vw, 18px)",
            lineHeight: 1.15,
            wordBreak: "break-word",
          }}
        >
          {getStatusLabel(status, reportFormat)}
        </div>

        {safeMessage && (
          <div
            style={{
              fontSize: "clamp(14px, 3.6vw, 15px)",
              lineHeight: 1.5,
              whiteSpace: "pre-line",
              wordBreak: "break-word",
            }}
          >
            {safeMessage}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {status === "ready" && onDownloadNow && (
          <button
            type="button"
            className="permiso-trabajo-btn"
            onClick={onDownloadNow}
            style={{ minWidth: 160, flex: "1 1 160px", width: "100%" }}
          >
            Descargar ahora
          </button>
        )}

        {status === "error" && onRetry && (
          <button
            type="button"
            className="permiso-trabajo-btn"
            onClick={onRetry}
            style={{ minWidth: 160, flex: "1 1 160px", width: "100%" }}
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

export default ReportDownloadStatusCard;
