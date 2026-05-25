import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  canPromptPushPermission,
  requestPushPermissionFromUserGesture,
  syncPushSubscriptionForAuthenticatedWorker,
} from "../../../pushNotifications";

function shouldShowPushSyncError(status) {
  return status?.reason !== "permission-not-granted";
}

function LoadingRouteScreen() {
  return (
    <div className="App">
      <div className="form-container">
        <div className="card-section" style={{ alignItems: "center", textAlign: "center" }}>
          <h2 className="card-title">GRUAMAN &amp; BOMBERMAN</h2>
          <p style={{ marginTop: 12 }}>Recovering your secure session...</p>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isHydrating, isReady, rehydrate, session } = useAuth();
  const location = useLocation();
  const [isRecovering, setIsRecovering] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushActionLoading, setPushActionLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const lastRecoveryPathRef = useRef("");
  const lastPushPromptSessionKeyRef = useRef("");
  const requestedPath = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    if (!isReady || isHydrating || isAuthenticated) {
      setIsRecovering(false);
      return;
    }

    if (lastRecoveryPathRef.current === requestedPath) {
      return;
    }

    let isCancelled = false;
    lastRecoveryPathRef.current = requestedPath;
    setIsRecovering(true);

    rehydrate({ reason: "protected-route-guard" })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) {
          setIsRecovering(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isHydrating, isReady, rehydrate, requestedPath]);

  useEffect(() => {
    if (!isReady || isHydrating || !isAuthenticated || !canPromptPushPermission()) {
      setShowPushModal(false);
      return;
    }

    const permission = Notification.permission;
    if (permission === "granted") {
      setShowPushModal(false);
      setPushMessage("");
      return;
    }

    const sessionKey = `${session?.kind ?? ""}:${session?.user?.documentId ?? ""}:${session?.expiresAt ?? ""}`;
    if (!sessionKey || lastPushPromptSessionKeyRef.current === sessionKey) {
      return;
    }

    lastPushPromptSessionKeyRef.current = sessionKey;
    setShowPushModal(true);
  }, [isAuthenticated, isHydrating, isReady, session]);

  const handlePushModalChoice = async (shouldRequestPermission) => {
    setPushActionLoading(true);
    setPushMessage("");

    try {
      if (shouldRequestPermission) {
        await requestPushPermissionFromUserGesture();
      }

      const currentPermission =
        typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied";

      if (currentPermission !== "granted") {
        setPushMessage(
          currentPermission === "denied"
            ? "Notificaciones bloqueadas. Habilitalas en permisos del sitio para este navegador."
            : "No se otorgó permiso de notificaciones en este intento."
        );
        return;
      }

      const workerId =
        session?.kind === "worker"
          ? session?.user?.documentId || session?.user?.id || session?.legacyProfile?.numero_identificacion || ""
          : "";

      if (workerId) {
        const syncResult = await syncPushSubscriptionForAuthenticatedWorker(workerId, {
          allowPermissionPrompt: false,
          force: true,
        });

        if (!syncResult?.ok && shouldShowPushSyncError(syncResult)) {
          setPushMessage(syncResult?.message || "No pudimos sincronizar notificaciones en este dispositivo.");
          return;
        }
      }

      setShowPushModal(false);
      setPushMessage("");
    } finally {
      setPushActionLoading(false);
    }
  };

  if (!isReady || isHydrating || isRecovering) {
    return <LoadingRouteScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/cedula" replace />;
  }

  return (
    <>
      {children ?? <Outlet />}
      {showPushModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(31,38,135,0.18)",
            zIndex: 10030,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 390,
              background: "rgba(255,255,255,0.28)",
              borderRadius: 18,
              padding: "30px 24px",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1.5px solid rgba(255,255,255,0.35)",
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <svg
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1976d2"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ margin: "0 auto" }}
              >
                <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                <path d="M9 17a3 3 0 0 0 6 0" />
              </svg>
            </div>

            <h3 style={{ margin: 0, fontSize: 20, color: "#1976d2", fontWeight: 700 }}>
              Activar notificaciones
            </h3>
            <p style={{ marginTop: 10, color: "#333", lineHeight: 1.5, fontSize: 14 }}>
              Querés habilitar notificaciones en este dispositivo para recibir avisos del sistema?
            </p>
            {pushMessage ? (
              <p style={{ marginTop: 10, color: "#c00", fontSize: 13, lineHeight: 1.45, fontWeight: 500 }}>
                {pushMessage}
              </p>
            ) : null}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setShowPushModal(false);
                }}
                disabled={pushActionLoading}
                style={{
                  background: "#f5f5f5",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: pushActionLoading ? "not-allowed" : "pointer",
                }}
              >
                Ahora no
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePushModalChoice(true).catch(() => {});
                }}
                disabled={pushActionLoading}
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontSize: 15,
                  boxShadow: "0 2px 8px rgba(25,118,210,0.18)",
                  cursor: pushActionLoading ? "not-allowed" : "pointer",
                  opacity: pushActionLoading ? 0.7 : 1,
                  fontWeight: 600,
                }}
              >
                {pushActionLoading ? "Procesando..." : "Activar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProtectedRoute;
