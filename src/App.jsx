import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import "./App.css";
import InstallPWAButton from "./components/InstallPWAButton";
import IntroVideo from "./components/IntroVideo";
import SlowConnectionBanner from "./components/SlowConnectionBanner";
import { subscribeUser } from "./pushNotifications";
import { getSessionHomePath } from "./features/auth/adapters/authSessionAdapter";
import { useAuth } from "./features/auth/hooks/useAuth";
import { readReturnTo } from "./features/auth/utils/returnTo";

function isBrowserEnvironment() {
  return typeof window !== "undefined";
}

function resolveAdminLanding(session) {
  const pendingReturnTo = readReturnTo();

  if (
    pendingReturnTo &&
    (pendingReturnTo.startsWith("/administrador") ||
      pendingReturnTo.startsWith("/indicador-central-admin"))
  ) {
    return pendingReturnTo;
  }

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
  const isLiteMode =
    isBrowserEnvironment() && window.sessionStorage.getItem("lite_mode") === "true";
  const [showIntro, setShowIntro] = useState(!isLiteMode);
  const [showLiteBanner, setShowLiteBanner] = useState(true);

  useEffect(() => {
    const workerId =
      session?.kind === "worker" ? session.user?.documentId || session.user?.id || "" : "";

    if (!workerId || !isBrowserEnvironment()) {
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    subscribeUser(workerId).catch(() => {});
  }, [session]);

  const handleIntroEnd = () => setShowIntro(false);

  const handleSlowDetected = () => {
    if (!isLiteMode) {
      setShowLiteBanner(true);
    }
  };

  const handleUseLite = () => {
    if (isBrowserEnvironment()) {
      window.sessionStorage.setItem("lite_mode", "true");
    }

    setShowLiteBanner(false);
    setShowIntro(false);
  };

  const handleDismissBanner = () => setShowLiteBanner(false);

  const redirectTarget =
    isReady && !isHydrating
      ? isAuthenticated
        ? resolveSessionLanding(session)
        : "/cedula"
      : "";

  return (
    <div className="App">
      {showIntro ? (
        <IntroVideo onVideoEnd={handleIntroEnd} onSlowDetected={handleSlowDetected} />
      ) : redirectTarget ? (
        <Navigate to={redirectTarget} replace />
      ) : (
        <LoadingScreen />
      )}

      {showLiteBanner && (
        <SlowConnectionBanner
          onUseLite={handleUseLite}
          onDismiss={handleDismissBanner}
        />
      )}
      <InstallPWAButton />
    </div>
  );
}

export default App;
