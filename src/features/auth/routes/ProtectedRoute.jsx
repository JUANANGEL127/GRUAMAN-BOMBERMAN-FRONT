import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { saveReturnTo } from "../utils/returnTo";

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
  const { isAuthenticated, isHydrating, isReady, rehydrate } = useAuth();
  const location = useLocation();
  const [isRecovering, setIsRecovering] = useState(false);
  const lastRecoveryPathRef = useRef("");
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

  if (!isReady || isHydrating || isRecovering) {
    return <LoadingRouteScreen />;
  }

  if (!isAuthenticated) {
    saveReturnTo(requestedPath);
    return <Navigate to="/cedula" replace />;
  }

  return children ?? <Outlet />;
}

export default ProtectedRoute;
