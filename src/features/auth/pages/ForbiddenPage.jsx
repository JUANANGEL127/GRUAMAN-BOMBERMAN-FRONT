import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import InstallPWAButton from "../../../components/InstallPWAButton";
import { getSessionHomePath } from "../adapters/authSessionAdapter";
import { useAuth } from "../hooks/useAuth";

function resolveAdminLanding(session) {
  const homePath = getSessionHomePath(session);

  return homePath;
}

export function ForbiddenPage() {
  const navigate = useNavigate();
  const { isAuthenticated, session } = useAuth();

  const homePath = useMemo(() => {
    if (!isAuthenticated || !session) {
      return "/cedula";
    }

    if (session.kind === "admin") {
      return resolveAdminLanding(session);
    }

    return getSessionHomePath(session);
  }, [isAuthenticated, session]);

  return (
    <div className="App">
      <div className="form-container">
        <div className="card-section" style={{ alignItems: "center", textAlign: "center" }}>
          <h2 className="card-title">Access denied</h2>
          <p style={{ marginTop: 12 }}>
            Your session is active, but it cannot open this screen.
          </p>
          <button
            className="button"
            onClick={() => navigate(homePath, { replace: true })}
            style={{ marginTop: 18 }}
          >
            Go back
          </button>
        </div>
      </div>
      <InstallPWAButton />
    </div>
  );
}

export default ForbiddenPage;
