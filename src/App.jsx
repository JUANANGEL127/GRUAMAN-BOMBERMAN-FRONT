import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import "./App.css";
import IntroVideo from "./components/IntroVideo";
import { useCampaign } from "./features/campaigns";
import { syncPushSubscriptionForAuthenticatedWorker } from "./pushNotifications";
import { getSessionHomePath } from "./features/auth/adapters/authSessionAdapter";
import { useAuth } from "./features/auth/hooks/useAuth";

function isBrowserEnvironment() {
  return typeof window !== "undefined";
}

function isLiteModeEnabled() {
  if (!isBrowserEnvironment()) {
    return false;
  }

  try {
    return window.sessionStorage.getItem("lite_mode") === "true";
  } catch {
    return false;
  }
}

function resolveAdminLanding(session) {
  return getSessionHomePath(session);
}

function resolveSessionLanding(session) {
  if (!session) {
    return "/cedula";
  }

  if (session.kind === "admin") {
    return resolveAdminLanding(session);
  }

  return getSessionHomePath(session);
}

function LoadingScreen() {
  return (
    <div className="form-container">
      <div className="card-section" style={{ alignItems: "center", textAlign: "center" }}>
        <h2 className="card-title">Preparing your session</h2>
        <p style={{ marginTop: 12 }}>We are validating your secure cookies with the backend.</p>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isHydrating, isReady, session } = useAuth();
  const { hasActiveCampaign, isLoading: isCampaignLoading } = useCampaign();
  const [showIntro, setShowIntro] = useState(() => !isLiteModeEnabled());

  useEffect(() => {
    if (!isReady || !isAuthenticated || session?.kind !== "worker") {
      return;
    }

    const workerId =
      session?.kind === "worker" ? session.user?.documentId || session.user?.id || "" : "";

    if (!workerId || !isBrowserEnvironment()) {
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    syncPushSubscriptionForAuthenticatedWorker(workerId, {
      allowPermissionPrompt: false,
    }).catch(() => {});
  }, [isAuthenticated, isReady, session]);

  useEffect(() => {
    if (!hasActiveCampaign) {
      return;
    }

    setShowIntro(false);
  }, [hasActiveCampaign]);

  const handleIntroEnd = () => setShowIntro(false);

  const redirectTarget =
    isReady && !isHydrating
      ? isAuthenticated
        ? resolveSessionLanding(session)
        : "/cedula"
      : "";
  const shouldShowIntro = !hasActiveCampaign && showIntro;

  return (
    <div className="App">
      {isCampaignLoading && !hasActiveCampaign ? (
        <LoadingScreen />
      ) : shouldShowIntro ? (
        <IntroVideo onVideoEnd={handleIntroEnd} />
      ) : redirectTarget ? (
        <Navigate to={redirectTarget} replace />
      ) : (
        <LoadingScreen />
      )}
    </div>
  );
}

export default App;
