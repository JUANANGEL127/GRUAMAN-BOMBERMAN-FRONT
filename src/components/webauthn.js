// WebAuthn integration for registration and authentication (biometría)
// Usa variable de entorno para la base de la API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
// Adapt endpoints to your backend domain if needed

// Helper: base64/base64url to Uint8Array
function base64ToUint8Array(base64) {
  // Convierte base64-url a base64 estándar
  let b64 = base64.replace(/-/g, '+').replace(/_/g, '/');
  // Añade padding si falta
  while (b64.length % 4) b64 += '=';
  try {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  } catch (e) {
    console.error('[WebAuthn] Error decodificando base64/base64url:', base64, e);
    throw e;
  }
}

// Helper: ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// 1. Registro de credencial biométrica
export async function registerWebAuthn({ numero_identificacion, nombre }) {
  // a) Solicita opciones de registro al backend
  console.log('[WebAuthn] Iniciando registro biométrico:', { numero_identificacion, nombre });
  let options;
  try {
    const res = await fetch(`${API_BASE_URL}/webauthn/register/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_identificacion, nombre })
    });
    options = await res.json();
    console.log('[WebAuthn] Opciones recibidas del backend:', options);
  } catch (e) {
    console.error('[WebAuthn] Error obteniendo opciones de registro:', e);
    throw e;
  }

  try {
    // b) Prepara los datos para navigator.credentials.create
    if (!options.challenge) {
      console.error('[WebAuthn] El campo challenge no existe o es undefined:', options.challenge);
      throw new Error('El campo challenge no existe en las opciones de registro');
    }
    if (!options.user || !options.user.id) {
      console.error('[WebAuthn] El campo user.id no existe o es undefined:', options.user);
      throw new Error('El campo user.id no existe en las opciones de registro');
    }
    options.challenge = base64ToUint8Array(options.challenge);
    options.user.id = base64ToUint8Array(options.user.id);
    if (options.excludeCredentials) {
      options.excludeCredentials = options.excludeCredentials.map(c => ({
        ...c,
        id: base64ToUint8Array(c.id)
      }));
    }
    console.log('[WebAuthn] Opciones procesadas para navigator.credentials.create:', options);

    // c) Crea la credencial biométrica
    const credential = await navigator.credentials.create({ publicKey: options });
    console.log('[WebAuthn] Credencial creada:', credential);

    // d) Prepara la respuesta para el backend
    const attestationResponse = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      response: {
        clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
        attestationObject: arrayBufferToBase64(credential.response.attestationObject)
      },
      type: credential.type
    };
    console.log('[WebAuthn] Attestation response preparada:', attestationResponse);

    // e) Envía la respuesta al backend para guardar la credencial
    const verifyRes = await fetch(`${API_BASE_URL}/webauthn/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero_identificacion, attestationResponse })
    });
    const verifyJson = await verifyRes.json();
    console.log('[WebAuthn] Respuesta del backend al guardar credencial:', verifyJson);
    return verifyJson;
  } catch (e) {
    console.error('[WebAuthn] Error durante el registro biométrico:', e);
    throw e;
  }
}

// 2. Autenticación biométrica
export async function authenticateWebAuthn({ numero_identificacion }) {
  // a) Solicita opciones de autenticación al backend
  const res = await fetch(`${API_BASE_URL}/webauthn/authenticate/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero_identificacion })
  });
  const options = await res.json();
  options.challenge = base64ToUint8Array(options.challenge);
  if (options.allowCredentials) {
    options.allowCredentials = options.allowCredentials.map(c => ({
      ...c,
      id: base64ToUint8Array(c.id)
    }));
  }

  // b) Autenticación biométrica
  const assertion = await navigator.credentials.get({ publicKey: options });

  // c) Prepara la respuesta para el backend
  const assertionResponse = {
    id: assertion.id,
    rawId: arrayBufferToBase64(assertion.rawId),
    response: {
      clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON),
      authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData),
      signature: arrayBufferToBase64(assertion.response.signature),
      userHandle: assertion.response.userHandle ? arrayBufferToBase64(assertion.response.userHandle) : null
    },
    type: assertion.type
  };

  // d) Envía la respuesta al backend para verificar autenticación
  const verifyRes = await fetch(`${API_BASE_URL}/webauthn/authenticate/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero_identificacion, assertionResponse })
  });
  return await verifyRes.json();
}

// Uso:
// import { registerWebAuthn, authenticateWebAuthn } from './webauthn';
// await registerWebAuthn({ numero_identificacion, nombre });
// await authenticateWebAuthn({ numero_identificacion });
