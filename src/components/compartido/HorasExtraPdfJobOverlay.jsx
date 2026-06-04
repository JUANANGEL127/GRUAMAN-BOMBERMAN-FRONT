import React from "react";
import ReportDownloadStatusCard from "./ReportDownloadStatusCard";
import { useHorasExtraPdfJob } from "./HorasExtraPdfJobContext";

export function HorasExtraPdfJobOverlay() {
  const { state, retryLastDownload, downloadReadyFile, clearState } = useHorasExtraPdfJob();

  React.useEffect(() => {
    console.log("[HorasExtraPdfJobOverlay] mount");
    return () => {
      console.log("[HorasExtraPdfJobOverlay] unmount");
    };
  }, []);

  React.useEffect(() => {
    console.log("[HorasExtraPdfJobOverlay] state snapshot", state);
  }, [state]);

  if (!state || state.status === "idle") {
    console.log("[HorasExtraPdfJobOverlay] render skipped", state?.status);
    return null;
  }

  console.log("[HorasExtraPdfJobOverlay] render card", state.status);

  return (
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
      }}
    >
      <div style={{ pointerEvents: "auto" }}>
        <ReportDownloadStatusCard
          status={state.status}
          message={state.message}
          jobId={state.jobId}
          statusUrl={state.statusUrl}
          downloadUrl={state.downloadUrl}
          fileName={state.fileName}
          onRetry={retryLastDownload}
          onDownloadNow={downloadReadyFile}
          onDismiss={clearState}
        />
      </div>
    </div>
  );
}

export default HorasExtraPdfJobOverlay;
