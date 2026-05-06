import api from "../utils/api";

/**
 * Returns true when the current device exposes a platform authenticator
 * such as Touch ID, Face ID, or fingerprint sensors through WebAuthn.
 *
 * @returns {Promise<boolean>}
 */
export async function checkWebAuthnSupport() {
  if (typeof window === "undefined" || !window.PublicKeyCredential) {
    return false;
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

function base64ToUint8Array(base64) {
  let normalizedBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
  while (normalizedBase64.length % 4) {
    normalizedBase64 += "=";
  }

  return Uint8Array.from(atob(normalizedBase64), (char) => char.charCodeAt(0));
}

function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function getAuthRequestConfig() {
  return {
    skipAuthHandling: true,
  };
}

function buildWebAuthnAssertion(assertion) {
  return {
    id: assertion.id,
    rawId: arrayBufferToBase64(assertion.rawId),
    response: {
      clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON),
      authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData),
      signature: arrayBufferToBase64(assertion.response.signature),
      userHandle: assertion.response.userHandle
        ? arrayBufferToBase64(assertion.response.userHandle)
        : null,
    },
    type: assertion.type,
  };
}

function buildWebAuthnAttestation(credential) {
  return {
    id: credential.id,
    rawId: arrayBufferToBase64(credential.rawId),
    response: {
      clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
      attestationObject: arrayBufferToBase64(credential.response.attestationObject),
    },
    type: credential.type,
  };
}

/**
 * Custom error used by the login screen to map device/WebAuthn failures to UX states.
 */
export class WebAuthnError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "WebAuthnError";
    this.code = code;
  }
}

/**
 * Starts passkey registration and verifies the attestation with the backend.
 *
 * The backend is responsible for issuing/refreshing the cookie-based session
 * after `/webauthn/register/verify` succeeds.
 *
 * @param {{ numero_identificacion: string, nombre?: string }} params
 * @returns {Promise<object>}
 */
export async function registerWebAuthn({ numero_identificacion, nombre = "" }) {
  const optionsResponse = await api.post(
    "/webauthn/register/options",
    {
      numero_identificacion,
      nombre,
    },
    getAuthRequestConfig()
  );

  const publicKeyOptions = optionsResponse.data ?? {};

  if (!publicKeyOptions.challenge) {
    throw new WebAuthnError("Missing challenge in registration options.", "PARSE_ERROR");
  }

  if (!publicKeyOptions.user?.id) {
    throw new WebAuthnError("Missing user.id in registration options.", "PARSE_ERROR");
  }

  publicKeyOptions.challenge = base64ToUint8Array(publicKeyOptions.challenge);
  publicKeyOptions.user.id = base64ToUint8Array(publicKeyOptions.user.id);

  if (Array.isArray(publicKeyOptions.excludeCredentials)) {
    publicKeyOptions.excludeCredentials = publicKeyOptions.excludeCredentials.map((credential) => ({
      ...credential,
      id: base64ToUint8Array(credential.id),
    }));
  }

  let credential;
  try {
    credential = await navigator.credentials.create({
      publicKey: publicKeyOptions,
    });
  } catch (error) {
    if (error?.name === "NotAllowedError") {
      throw new WebAuthnError("The registration flow was cancelled by the user.", "USER_CANCELLED");
    }

    throw new WebAuthnError("Unable to create a WebAuthn credential.", "UNKNOWN");
  }

  const verifyResponse = await api.post(
    "/webauthn/register/verify",
    {
      numero_identificacion,
      attestationResponse: buildWebAuthnAttestation(credential),
    },
    getAuthRequestConfig()
  );

  return verifyResponse.data;
}

/**
 * Starts passkey authentication and verifies the assertion with the backend.
 *
 * The backend is responsible for issuing/refreshing the cookie-based session
 * after `/webauthn/authenticate/verify` succeeds.
 *
 * @param {{ numero_identificacion: string }} params
 * @returns {Promise<object>}
 */
export async function authenticateWebAuthn({ numero_identificacion }) {
  let optionsResponse;

  try {
    optionsResponse = await api.post(
      "/webauthn/authenticate/options",
      {
        numero_identificacion,
      },
      getAuthRequestConfig()
    );
  } catch {
    throw new WebAuthnError(
      "Unable to load authentication options from the server.",
      "NETWORK_ERROR"
    );
  }

  const publicKeyOptions = optionsResponse.data ?? {};

  try {
    publicKeyOptions.challenge = base64ToUint8Array(publicKeyOptions.challenge);

    if (Array.isArray(publicKeyOptions.allowCredentials)) {
      publicKeyOptions.allowCredentials = publicKeyOptions.allowCredentials.map((credential) => ({
        ...credential,
        id: base64ToUint8Array(credential.id),
      }));
    }
  } catch {
    throw new WebAuthnError("Unable to parse authentication options.", "PARSE_ERROR");
  }

  let assertion;
  try {
    assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions,
    });
  } catch (error) {
    const errorName = error?.name || "";
    const errorMessage = String(error?.message ?? "").toLowerCase();
    const userCancelled =
      errorMessage.includes("cancel") ||
      errorMessage.includes("abort") ||
      errorMessage.includes("dismissed") ||
      errorMessage.includes("user gesture") ||
      errorMessage.includes("not focused");

    if (errorName === "NotAllowedError" && userCancelled) {
      throw new WebAuthnError("The authentication flow was cancelled by the user.", "USER_CANCELLED");
    }

    if (errorName === "NotAllowedError") {
      throw new WebAuthnError("There are no passkeys available on this device.", "NO_CREDENTIALS");
    }

    if (errorName === "InvalidStateError") {
      throw new WebAuthnError("The authenticator is in an invalid state.", "INVALID_STATE");
    }

    throw new WebAuthnError("Unable to complete biometric authentication.", "UNKNOWN");
  }

  if (!assertion) {
    throw new WebAuthnError("navigator.credentials.get returned no assertion.", "NO_RESPONSE");
  }

  const verifyResponse = await api.post(
    "/webauthn/authenticate/verify",
    {
      numero_identificacion,
      assertionResponse: buildWebAuthnAssertion(assertion),
    },
    getAuthRequestConfig()
  );

  return verifyResponse.data;
}
