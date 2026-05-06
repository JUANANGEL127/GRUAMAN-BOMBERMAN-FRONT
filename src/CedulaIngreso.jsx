import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./utils/api";
import {
  authenticateWebAuthn,
  checkWebAuthnSupport,
  registerWebAuthn,
  WebAuthnError,
} from "./components/webauthn";
import { subscribeUser } from "./pushNotifications";
import { useAuth } from "./features/auth/hooks/useAuth";
import {
  getSessionHomePath,
  isAuthenticatedAuthSession,
  mergeAuthSessions,
  normalizeAdminLoginResponse,
  normalizeAuthSession,
  normalizePinSetResponse,
  normalizePinStatusResponse,
  normalizePinVerifyResponse,
  toWorkerCompatibilityUser,
} from "./features/auth/adapters/authSessionAdapter";
import { consumeReturnTo, readReturnTo } from "./features/auth/utils/returnTo";

const WEB_AUTHN_DIAGNOSTIC = Object.freeze({
  titulo: "Este dispositivo no puede usar huella dactilar",
  pasos: [
    "Verifica que tengas Google Services instalado y actualizado.",
    "Asegúrate de tener una cuenta de Google activa y configurada en el teléfono.",
    "Revisa que tengas huella dactilar registrada en Ajustes → Seguridad.",
    "Revisa que las Llaves de acceso estén habilitadas en tu cuenta de Google (passwords.google.com).",
    "Si ninguna de las anteriores aplica, contacta al administrador.",
  ],
});

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 600 : true
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 599px)");
    const handleChange = (event) => setIsMobile(event.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return isMobile;
}

function buildWorkerHint(documentId, fallback = null) {
  return mergeAuthSessions(
    fallback,
    normalizeAuthSession(
      {
        numero_identificacion: documentId,
      },
      {
        source: "cedula-input",
        defaultKind: "worker",
        authenticatedByDefault: false,
      }
    )
  );
}

function getWorkerLookupErrorMessage(sessionHint) {
  // Note: 'active' validation should only happen AFTER auth (PIN verify, webauthn verify)
  // At the lookup stage, we only check for explicit backend errors.
  // The backend will validate user status during PIN/webauthn verification.
  
  if (sessionHint?.authFlow?.success === false && sessionHint?.authFlow?.errorMessage) {
    return sessionHint.authFlow.errorMessage;
  }

  return "";
}

async function subscribeAuthenticatedWorker(workerUser) {
  if (
    typeof window === "undefined" ||
    !workerUser?.numero_identificacion ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await subscribeUser(workerUser.numero_identificacion).catch(() => {});
    }
  } catch {
    // Push notifications are best-effort and should not block login recovery.
  }
}

function CedulaIngresoContent({ onUsuarioEncontrado }) {
  const navigate = useNavigate();
  const { isAuthenticated, isReady, session, signIn } = useAuth();

  const [cedula, setCedula] = useState("");
  const [error, setError] = useState("");
  const [gifIndex, setGifIndex] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminShowPass, setAdminShowPass] = useState(false);
  const [showRegistrarLlaveModal, setShowRegistrarLlaveModal] = useState(false);
  const [registrarLlaveLoading, setRegistrarLlaveLoading] = useState(false);
  const [pendingSessionHint, setPendingSessionHint] = useState(null);
  const [diagnostico, setDiagnostico] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModo, setPinModo] = useState("verificar");
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  const handledSessionRef = useRef("");
  const isMobile = useIsMobile();
  const isLite = sessionStorage.getItem("lite_mode") === "true";

  useEffect(() => {
    if (isLite) {
      return undefined;
    }

    const gifs = ["/gruaman1.1.gif", "/bomberman1.1.gif"];
    const interval = setInterval(() => {
      setGifIndex((previousValue) => (previousValue + 1) % gifs.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isLite]);

  const finalizeAuthenticatedSession = useCallback(
    async (authenticatedSession) => {
      if (!isAuthenticatedAuthSession(authenticatedSession)) {
        return;
      }

      if (authenticatedSession.kind === "worker") {
        const workerUser = toWorkerCompatibilityUser(authenticatedSession);
        await subscribeAuthenticatedWorker(workerUser);

        if (onUsuarioEncontrado) {
          onUsuarioEncontrado(workerUser);
          return;
        }

        navigate("/bienvenida", { replace: true });
        return;
      }

      const pendingAdminReturnTo = readReturnTo();
      const nextAdminPath =
        pendingAdminReturnTo && pendingAdminReturnTo.startsWith("/administrador")
          ? consumeReturnTo()
          : getSessionHomePath(authenticatedSession);

      navigate(nextAdminPath, { replace: true });
    },
    [navigate, onUsuarioEncontrado]
  );

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      return;
    }

    const handledSessionKey = [
      session?.kind ?? "",
      session?.user?.documentId ?? "",
      session?.expiresAt ?? "",
    ].join(":");

    if (!handledSessionKey || handledSessionRef.current === handledSessionKey) {
      return;
    }

    handledSessionRef.current = handledSessionKey;
    finalizeAuthenticatedSession(session).catch(() => {});
  }, [finalizeAuthenticatedSession, isAuthenticated, isReady, session]);

  const handleBuscar = async () => {
    const normalizedCedula = cedula.trim();
    setError("");
    setDiagnostico(null);

    if (!normalizedCedula) {
      setError("Por favor ingresa tu número de identificación.");
      return;
    }

    try {
      const pinStatusResponse = await api.get("/auth/pin/status", {
        params: {
          numero_identificacion: normalizedCedula,
        },
        skipAuthHandling: true,
      });

      const workerSessionHint = buildWorkerHint(
        normalizedCedula,
        normalizePinStatusResponse(pinStatusResponse.data)
      );
      const lookupErrorMessage = getWorkerLookupErrorMessage(workerSessionHint);

      if (lookupErrorMessage) {
        setError(lookupErrorMessage);
        return;
      }

      setPendingSessionHint(workerSessionHint);

      if (workerSessionHint.authFlow.pinEnabled) {
        setPinModo(workerSessionHint.authFlow.pinConfigured ? "verificar" : "crear");
        setPinInput("");
        setPinConfirm("");
        setPinError("");
        setShowPinModal(true);
        return;
      }

      const soportaBiometria = await checkWebAuthnSupport();
      if (!soportaBiometria) {
        setDiagnostico(WEB_AUTHN_DIAGNOSTIC);
        return;
      }

      let biometriaRegistrada = false;
      try {
        const hasCredentialResponse = await api.post(
          "/webauthn/hasCredential",
          { numero_identificacion: normalizedCedula },
          { skipAuthHandling: true }
        );
        biometriaRegistrada = Boolean(hasCredentialResponse.data?.hasCredential);
      } catch {
        biometriaRegistrada = false;
      }

      let authVerificationPayload;

      if (!biometriaRegistrada) {
        try {
          authVerificationPayload = await registerWebAuthn({
            numero_identificacion: normalizedCedula,
            nombre: workerSessionHint.user.name || workerSessionHint.legacyProfile.nombre_trabajador,
          });
        } catch (webAuthnError) {
          if (webAuthnError instanceof WebAuthnError && webAuthnError.code === "USER_CANCELLED") {
            setError("Cancelaste el registro de huella. Inténtalo de nuevo.");
          } else {
            setError(
              "No se pudo registrar la biometría. Verifica que tengas huella dactilar configurada en los ajustes del teléfono."
            );
          }
          return;
        }
      } else {
        try {
          authVerificationPayload = await authenticateWebAuthn({
            numero_identificacion: normalizedCedula,
          });
        } catch (webAuthnError) {
          if (webAuthnError instanceof WebAuthnError && webAuthnError.code === "USER_CANCELLED") {
            setError("Cancelaste la autenticación. Inténtalo de nuevo.");
            return;
          }

          if (webAuthnError instanceof WebAuthnError && webAuthnError.code === "NO_CREDENTIALS") {
            setShowRegistrarLlaveModal(true);
            return;
          }

          setError("No se pudo autenticar. Inténtalo de nuevo.");
          return;
        }
      }

      const authenticatedSession = await signIn({
        hintSession: mergeAuthSessions(
          normalizeAuthSession(authVerificationPayload, {
            source: biometriaRegistrada
              ? "/webauthn/authenticate/verify"
              : "/webauthn/register/verify",
            defaultKind: "worker",
            authenticatedByDefault: true,
          }),
          workerSessionHint
        ),
        source: biometriaRegistrada ? "webauthn-authenticate" : "webauthn-register",
      });

      await finalizeAuthenticatedSession(authenticatedSession);
    } catch {
      setError("No haces parte de nuestros super héroes.");
    }
  };

  const handleAdminLogin = async () => {
    setAdminError("");
    setAdminLoading(true);

    try {
      const response = await api.post(
        "/admin/login",
        { password: adminPass },
        { skipAuthHandling: true }
      );
      const adminSessionHint = normalizeAdminLoginResponse(response.data);

      if (!adminSessionHint.authFlow.success) {
        setAdminError(adminSessionHint.authFlow.errorMessage || "Contraseña incorrecta.");
        return;
      }

      setShowAdminModal(false);

      const authenticatedSession = await signIn({
        hintSession: adminSessionHint,
        source: "admin-login",
      });

      await finalizeAuthenticatedSession(authenticatedSession);
    } catch {
      setAdminError("Error de conexión.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleRegistrarNuevaLlave = async () => {
    if (!pendingSessionHint) {
      return;
    }

    const numeroIdentificacion = pendingSessionHint.user.documentId || cedula.trim();
    const nombre = pendingSessionHint.user.name || pendingSessionHint.legacyProfile.nombre_trabajador;

    setRegistrarLlaveLoading(true);
    setError("");

    try {
      const verificationPayload = await registerWebAuthn({
        numero_identificacion: numeroIdentificacion,
        nombre,
      });

      setShowRegistrarLlaveModal(false);

      const authenticatedSession = await signIn({
        hintSession: mergeAuthSessions(
          normalizeAuthSession(verificationPayload, {
            source: "/webauthn/register/verify",
            defaultKind: "worker",
            authenticatedByDefault: true,
          }),
          pendingSessionHint
        ),
        source: "webauthn-register",
      });

      setPendingSessionHint(null);
      await finalizeAuthenticatedSession(authenticatedSession);
    } catch {
      setError("No se pudo registrar la nueva llave de acceso en este dispositivo.");
      setShowRegistrarLlaveModal(false);
      setPendingSessionHint(null);
    } finally {
      setRegistrarLlaveLoading(false);
    }
  };

  const handleCancelarRegistroLlave = () => {
    setShowRegistrarLlaveModal(false);
    setPendingSessionHint(null);
    setError("Debes registrar una llave de acceso para continuar.");
  };

  const handlePinSubmit = async () => {
    if (!pendingSessionHint) {
      return;
    }

    const numeroIdentificacion = pendingSessionHint.user.documentId || cedula.trim();
    setPinError("");

    if (!/^\d{4,8}$/.test(pinInput)) {
      setPinError("El PIN debe ser numérico de 4 a 8 dígitos.");
      return;
    }

    if (pinModo === "crear" && pinInput !== pinConfirm) {
      setPinError("Los PINes no coinciden.");
      return;
    }

    setPinLoading(true);

    try {
      const pinResponse =
        pinModo === "crear"
          ? await api.post(
              "/auth/pin/set",
              {
                numero_identificacion: numeroIdentificacion,
                pin: pinInput,
              },
              { skipAuthHandling: true }
            )
          : await api.post(
              "/auth/pin/verify",
              {
                numero_identificacion: numeroIdentificacion,
                pin: pinInput,
              },
              { skipAuthHandling: true }
            );

      const normalizedPinSession =
        pinModo === "crear"
          ? normalizePinSetResponse(pinResponse.data)
          : normalizePinVerifyResponse(pinResponse.data);

      if (!normalizedPinSession.authFlow.success) {
        setPinError(
          normalizedPinSession.authFlow.errorMessage ||
            (pinModo === "crear"
              ? "No se pudo guardar el PIN."
              : "PIN incorrecto. Inténtalo de nuevo.")
        );
        return;
      }

      setShowPinModal(false);
      setPendingSessionHint(null);

      const authenticatedSession = await signIn({
        hintSession: mergeAuthSessions(normalizedPinSession, pendingSessionHint),
        source: pinModo === "crear" ? "pin-set" : "pin-verify",
      });

      await finalizeAuthenticatedSession(authenticatedSession);
    } catch (requestError) {
      if (requestError?.response?.status === 401) {
        setPinError("PIN incorrecto. Inténtalo de nuevo.");
      } else {
        setPinError(
          pinModo === "crear"
            ? "Error de conexión al guardar el PIN."
            : "Error de conexión al verificar el PIN."
        );
      }
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="form-container" style={{ position: "relative", minHeight: "100vh" }}>
      <div
        className="card-section"
        style={{
          background: isLite ? "#fff" : "rgba(255,255,255,0.22)",
          borderRadius: "18px",
          boxShadow: isLite ? "0 2px 12px rgba(0,0,0,0.10)" : "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          backdropFilter: isLite ? undefined : "blur(8px)",
          WebkitBackdropFilter: isLite ? undefined : "blur(8px)",
          border: isLite ? "1px solid #e0e0e0" : "1px solid rgba(255,255,255,0.28)",
          padding: "32px 24px",
          maxWidth: 400,
          margin: "0 auto",
          position: "relative",
          zIndex: 2,
        }}
      >
        <h2 className="card-title">Ingresa tu cédula para iniciar tu aventura</h2>
        <input
          className="input"
          type="text"
          value={cedula}
          onChange={(event) => setCedula(event.target.value)}
          placeholder="Número de identificación"
          style={isLite ? { background: "#f7faff", border: "1.5px solid #c5d5ea" } : undefined}
        />
        <button className="button" onClick={handleBuscar} style={{ marginTop: 16 }}>
          Continuar
        </button>
        {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
      </div>

      <button
        className="button"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 24,
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "12px 20px",
          boxShadow: "0 2px 8px rgba(25,118,210,0.10)",
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: 0.5,
          cursor: "pointer",
        }}
        onClick={() => {
          setShowAdminModal(true);
          setAdminPass("");
          setAdminError("");
        }}
      >
        Ingreso administrador
      </button>
      {showAdminModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(31,38,135,0.13)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: isLite ? "#fff" : "rgba(255,255,255,0.22)",
              borderRadius: 18,
              boxShadow: isLite ? "0 2px 12px rgba(0,0,0,0.10)" : "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
              backdropFilter: isLite ? undefined : "blur(8px)",
              WebkitBackdropFilter: isLite ? undefined : "blur(8px)",
              border: isLite ? "1px solid #e0e0e0" : "1.5px solid rgba(255,255,255,0.28)",
              padding: "32px 24px",
              minWidth: 300,
              textAlign: "center",
              position: "relative",
              fontFamily: "inherit",
            }}
          >
            <h3 style={{ marginBottom: 18, color: "#1976d2", fontWeight: 700, letterSpacing: 1 }}>
              Bienvenido administrador
            </h3>
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 320,
                margin: "0 auto 14px auto",
                display: "flex",
                alignItems: "center",
                background: "#f7faff",
                borderRadius: 8,
                border: "1.5px solid #1976d2",
                boxShadow: "0 2px 8px rgba(25,118,210,0.07)",
                transition: "box-shadow 0.2s",
              }}
            >
              <input
                type={adminShowPass ? "text" : "password"}
                placeholder="Contraseña"
                value={adminPass}
                onChange={(event) => setAdminPass(event.target.value)}
                style={{
                  flex: 1,
                  padding: "12px 44px 12px 14px",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 16,
                  background: "transparent",
                  color: "#222",
                  fontFamily: "inherit",
                  outline: "none",
                  minWidth: 0,
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAdminLogin();
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setAdminShowPass((value) => !value)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  margin: 0,
                  outline: "none",
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                  height: 32,
                  width: 32,
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "background 0.15s",
                }}
                aria-label={adminShowPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                onMouseDown={(event) => event.preventDefault()}
              >
                {adminShowPass ? (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1976d2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <ellipse cx="12" cy="12" rx="7" ry="5" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                ) : (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1976d2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.21-2.61 3.36-4.77 6-6.11" />
                    <path d="M1 1l22 22" />
                  </svg>
                )}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                className="button"
                onClick={handleAdminLogin}
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 22px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(25,118,210,0.13)",
                  letterSpacing: 0.5,
                }}
                disabled={adminLoading}
              >
                {adminLoading ? "Ingresando..." : "Ingresar"}
              </button>
              <button
                className="button"
                onClick={() => setShowAdminModal(false)}
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(25,118,210,0.07)",
                  letterSpacing: 0.5,
                }}
                disabled={adminLoading}
              >
                Cancelar
              </button>
            </div>
            {adminError && <div style={{ color: "#c00", marginTop: 14, fontWeight: 500 }}>{adminError}</div>}
          </div>
        </div>
      )}

      {showRegistrarLlaveModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(31,38,135,0.18)",
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: isLite ? "#fff" : "rgba(255,255,255,0.28)",
              borderRadius: 18,
              boxShadow: isLite ? "0 2px 12px rgba(0,0,0,0.10)" : "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
              backdropFilter: isLite ? undefined : "blur(12px)",
              WebkitBackdropFilter: isLite ? undefined : "blur(12px)",
              border: isLite ? "1px solid #e0e0e0" : "1.5px solid rgba(255,255,255,0.35)",
              padding: "32px 24px",
              minWidth: 300,
              maxWidth: 360,
              textAlign: "center",
              position: "relative",
              fontFamily: "inherit",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1976d2"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ margin: "0 auto" }}
              >
                <path d="M12 11c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" />
                <path d="M19 11h-4" />
                <path d="M15 7v8" />
                <path d="M12 11h-3" />
                <circle cx="9" cy="11" r="6" />
              </svg>
            </div>

            <h3 style={{ marginBottom: 14, color: "#1976d2", fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>
              Registrar llave de acceso
            </h3>

            <p style={{ color: "#333", fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
              No hay llaves de acceso disponibles en este dispositivo.
            </p>

            <p style={{ color: "#555", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              ¿Deseas registrar una nueva llave de acceso (huella dactilar o Face ID) para iniciar sesión desde este dispositivo?
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                className="button"
                onClick={handleRegistrarNuevaLlave}
                disabled={registrarLlaveLoading}
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: registrarLlaveLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(25,118,210,0.18)",
                  letterSpacing: 0.5,
                  opacity: registrarLlaveLoading ? 0.7 : 1,
                }}
              >
                {registrarLlaveLoading ? "Registrando..." : "Sí, registrar"}
              </button>
              <button
                className="button"
                onClick={handleCancelarRegistroLlave}
                disabled={registrarLlaveLoading}
                style={{
                  background: "#f5f5f5",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: registrarLlaveLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  letterSpacing: 0.5,
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPinModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(31,38,135,0.18)",
            zIndex: 10002,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: isLite ? "#fff" : "rgba(255,255,255,0.28)",
              borderRadius: 18,
              boxShadow: isLite ? "0 2px 12px rgba(0,0,0,0.10)" : "0 8px 32px 0 rgba(31,38,135,0.37)",
              backdropFilter: isLite ? undefined : "blur(12px)",
              WebkitBackdropFilter: isLite ? undefined : "blur(12px)",
              border: isLite ? "1px solid #e0e0e0" : "1.5px solid rgba(255,255,255,0.35)",
              padding: "32px 24px",
              minWidth: 300,
              maxWidth: 360,
              textAlign: "center",
              fontFamily: "inherit",
            }}
          >
            <div style={{ marginBottom: 14 }}>
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 style={{ marginBottom: 8, color: "#1976d2", fontWeight: 700, fontSize: 18 }}>
              {pinModo === "crear" ? "Crea tu PIN de acceso" : "Ingresa tu PIN"}
            </h3>
            {pinModo === "crear" && (
              <p style={{ color: "#555", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
                Este dispositivo usará un PIN en lugar de huella dactilar. Elige un PIN de 4 a 8 dígitos.
              </p>
            )}
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              placeholder={pinModo === "crear" ? "Nuevo PIN (4-8 dígitos)" : "Tu PIN"}
              value={pinInput}
              onChange={(event) => setPinInput(event.target.value.replace(/\D/g, ""))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handlePinSubmit();
                }
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                border: "1.5px solid #1976d2",
                borderRadius: 8,
                fontSize: 20,
                letterSpacing: 6,
                textAlign: "center",
                background: "#f7faff",
                marginBottom: 12,
                outline: "none",
                fontFamily: "inherit",
              }}
              autoFocus
            />
            {pinModo === "crear" && (
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                placeholder="Confirmar PIN"
                value={pinConfirm}
                onChange={(event) => setPinConfirm(event.target.value.replace(/\D/g, ""))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handlePinSubmit();
                  }
                }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  border: "1.5px solid #1976d2",
                  borderRadius: 8,
                  fontSize: 20,
                  letterSpacing: 6,
                  textAlign: "center",
                  background: "#f7faff",
                  marginBottom: 12,
                  outline: "none",
                  fontFamily: "inherit",
                }}
              />
            )}
            {pinError && <div style={{ color: "#c00", fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{pinError}</div>}
            <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
              <button
                onClick={handlePinSubmit}
                disabled={pinLoading}
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: pinLoading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(25,118,210,0.18)",
                  opacity: pinLoading ? 0.7 : 1,
                }}
              >
                {pinLoading ? "Verificando..." : pinModo === "crear" ? "Guardar PIN" : "Ingresar"}
              </button>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPendingSessionHint(null);
                }}
                disabled={pinLoading}
                style={{
                  background: "#f5f5f5",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: pinLoading ? "not-allowed" : "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {diagnostico && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(31,38,135,0.18)",
            zIndex: 10002,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: isLite ? "#fff" : "rgba(255,255,255,0.28)",
              borderRadius: 18,
              boxShadow: isLite ? "0 2px 12px rgba(0,0,0,0.10)" : "0 8px 32px 0 rgba(31,38,135,0.37)",
              backdropFilter: isLite ? undefined : "blur(12px)",
              WebkitBackdropFilter: isLite ? undefined : "blur(12px)",
              border: isLite ? "1px solid #e0e0e0" : "1.5px solid rgba(255,255,255,0.35)",
              padding: "32px 24px",
              minWidth: 300,
              maxWidth: 370,
              textAlign: "center",
              fontFamily: "inherit",
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <svg
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e65100"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ margin: "0 auto" }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 style={{ marginBottom: 12, color: "#e65100", fontWeight: 700, fontSize: 17 }}>
              {diagnostico.titulo}
            </h3>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
              Para solucionar el problema, verifica lo siguiente:
            </p>
            <ol style={{ textAlign: "left", color: "#333", fontSize: 13, lineHeight: 1.8, paddingLeft: 20, marginBottom: 20 }}>
              {diagnostico.pasos.map((paso, index) => (
                <li key={index}>{paso}</li>
              ))}
            </ol>
            <button
              className="button"
              onClick={() => setDiagnostico(null)}
              style={{
                background: "#e65100",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 28px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(230,81,0,0.18)",
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {isMobile && !isLite && (
        <img
          src={gifIndex === 0 ? "/gruaman1.1.gif" : "/bomberman1.1.gif"}
          alt={gifIndex === 0 ? "GruaMan animado" : "BomberMan animado"}
          style={{
            position: "absolute",
            top: "30%",
            left: 0,
            width: "95vw",
            height: "60vh",
            objectFit: "cover",
            zIndex: 1,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      )}
    </div>
  );
}

function CedulaIngreso(props) {
  return <CedulaIngresoContent {...props} />;
}

export default CedulaIngreso;
