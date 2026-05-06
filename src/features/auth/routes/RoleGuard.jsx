import { Navigate, Outlet } from "react-router-dom";
import { getLegacyAdminRole } from "../adapters/authSessionAdapter";
import { useAuth } from "../hooks/useAuth";

function LoadingRouteScreen() {
  return (
    <div className="App">
      <div className="form-container">
        <div className="card-section" style={{ alignItems: "center", textAlign: "center" }}>
          <h2 className="card-title">GRUAMAN &amp; BOMBERMAN</h2>
          <p style={{ marginTop: 12 }}>Validating route permissions...</p>
        </div>
      </div>
    </div>
  );
}

export function RoleGuard({
  allowedKinds = [],
  allowedAdminRoles = [],
  children,
}) {
  const { isAuthenticated, isHydrating, isReady, session } = useAuth();

  if (!isReady || isHydrating) {
    return <LoadingRouteScreen />;
  }

  if (!isAuthenticated || !session) {
    return <Navigate to="/cedula" replace />;
  }

  if (allowedKinds.length > 0 && !allowedKinds.includes(session.kind)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  if (session.kind === "admin" && allowedAdminRoles.length > 0) {
    const adminRole = getLegacyAdminRole(session);

    if (!allowedAdminRoles.includes(adminRole)) {
      return <Navigate to="/acceso-denegado" replace />;
    }
  }

  return children ?? <Outlet />;
}

export default RoleGuard;
