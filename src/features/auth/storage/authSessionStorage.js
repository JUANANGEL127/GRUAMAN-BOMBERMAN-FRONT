import {
  getLegacyAdminRole,
  isAuthenticatedAuthSession,
  toWorkerCompatibilityUser,
} from "../adapters/authSessionAdapter";

export const AUTH_SESSION_STORAGE_KEY = "auth.session.v1";
export const AUTH_CSRF_TOKEN_STORAGE_KEY = "auth.csrf.v1";
export const AUTH_SESSION_METADATA_MAX_AGE_MS = 15 * 60 * 1000;

const LEGACY_WORKER_AUTH_KEYS = Object.freeze([
  "nombre_trabajador",
  "cedula_trabajador",
  "cedula",
  "empresa_id",
  "empresa_trabajador",
  "cargo_trabajador",
  "usuario",
  "usuario_nombre",
]);

const LEGACY_ADMIN_AUTH_KEYS = Object.freeze(["admin_rol"]);
const LEGACY_WORK_CONTEXT_KEYS = Object.freeze([
  "obra",
  "obra_id",
  "constructora",
  "nombre_proyecto",
  "selectedCharacter",
  "game_mode",
  "game_mode_completed",
  "bomberman_inventariosobra_respuestas",
]);
const LEGACY_WORK_CONTEXT_PREFIXES = Object.freeze([
  "game_session_",
  "aic_usados_",
  "gruaman_usados_",
  "lideres_usados_",
  "sst_usados_",
  "tecnicos_usados_",
]);

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage ?? null;
}

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function sanitizeSessionForStorage(session) {
  return {
    kind: session?.kind ?? null,
    roles: Array.isArray(session?.roles) ? session.roles : [],
    user: {
      id: session?.user?.id ?? "",
      name: session?.user?.name ?? "",
      documentId: session?.user?.documentId ?? "",
      companyId: session?.user?.companyId ?? "",
      companySlug: session?.user?.companySlug ?? "",
      cargo: session?.user?.cargo ?? "",
    },
    transport: {
      type: session?.transport?.type ?? "cookie",
      cookieNames: Array.isArray(session?.transport?.cookieNames)
        ? session.transport.cookieNames
        : [],
      csrfCookie: session?.transport?.csrfCookie ?? null,
    },
    sessionStatus: session?.sessionStatus ?? "anonymous",
    expiresAt: session?.expiresAt ?? null,
    legacyProfile: {
      nombre_trabajador: session?.legacyProfile?.nombre_trabajador ?? "",
      cedula_trabajador: session?.legacyProfile?.cedula_trabajador ?? "",
      empresa_id: session?.legacyProfile?.empresa_id ?? "",
      empresa_trabajador: session?.legacyProfile?.empresa_trabajador ?? "",
      cargo_trabajador: session?.legacyProfile?.cargo_trabajador ?? "",
    },
  };
}

export function isAuthSessionMetadataFresh(record, now = Date.now()) {
  if (!record?.updatedAt) {
    return false;
  }

  const updatedAt = Date.parse(record.updatedAt);
  if (Number.isNaN(updatedAt)) {
    return false;
  }

  if (record?.session?.expiresAt) {
    const expiresAt = Date.parse(record.session.expiresAt);
    if (!Number.isNaN(expiresAt) && expiresAt <= now) {
      return false;
    }
  }

  return now - updatedAt <= AUTH_SESSION_METADATA_MAX_AGE_MS;
}

export function readAuthSessionMetadata() {
  const storage = getLocalStorage();

  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  const parsed = safeParseJson(rawValue);
  if (!parsed || parsed.version !== 1 || !parsed.session) {
    storage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  }

  if (!isAuthSessionMetadataFresh(parsed)) {
    storage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  }

  return parsed.session;
}

export function writeAuthSessionMetadata(session, { source = "unknown" } = {}) {
  const storage = getLocalStorage();

  if (!storage || !isAuthenticatedAuthSession(session)) {
    return;
  }

  const record = {
    version: 1,
    source,
    updatedAt: new Date().toISOString(),
    session: sanitizeSessionForStorage(session),
  };

  storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(record));
}

function removeStorageKeys(keys) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  keys.forEach((key) => storage.removeItem(key));
}

function removeStorageKeysByPrefix(prefixes) {
  const storage = getLocalStorage();
  if (!storage) return;

  const keysToRemove = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
}

export function clearLegacyAuthKeys() {
  removeStorageKeys([...LEGACY_WORKER_AUTH_KEYS, ...LEGACY_ADMIN_AUTH_KEYS]);
}

export function clearAuthSessionStorage() {
  const storage = getLocalStorage();

  if (storage) {
    storage.removeItem(AUTH_SESSION_STORAGE_KEY);
    storage.removeItem(AUTH_CSRF_TOKEN_STORAGE_KEY);
  }

  clearLegacyAuthKeys();
  removeStorageKeys(LEGACY_WORK_CONTEXT_KEYS);
  removeStorageKeysByPrefix(LEGACY_WORK_CONTEXT_PREFIXES);
}

export function readCsrfTokenStorage() {
  const storage = getLocalStorage();
  if (!storage) return "";
  return storage.getItem(AUTH_CSRF_TOKEN_STORAGE_KEY) || "";
}

export function writeCsrfTokenStorage(token) {
  const storage = getLocalStorage();
  if (!storage) return;

  const normalizedToken = typeof token === "string" ? token.trim() : "";
  if (!normalizedToken) return;
  storage.setItem(AUTH_CSRF_TOKEN_STORAGE_KEY, normalizedToken);
}

export function syncLegacySessionKeys(session) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  clearLegacyAuthKeys();

  if (!isAuthenticatedAuthSession(session)) {
    return;
  }

  if (session.kind === "worker") {
    const workerUser = toWorkerCompatibilityUser(session);
    const empresaId = workerUser.empresa_id ? String(workerUser.empresa_id) : "";

    storage.setItem("nombre_trabajador", workerUser.nombre);
    storage.setItem("cedula_trabajador", workerUser.numero_identificacion);
    storage.setItem("cedula", workerUser.numero_identificacion);
    storage.setItem("empresa_id", empresaId);

    if (workerUser.empresa) {
      storage.setItem("empresa_trabajador", workerUser.empresa);
    }

    if (workerUser.cargo) {
      storage.setItem("cargo_trabajador", workerUser.cargo);
    }

    storage.setItem("usuario_nombre", workerUser.nombre);
    storage.setItem("usuario", JSON.stringify(workerUser));
    return;
  }

  const adminRole = getLegacyAdminRole(session);
  if (adminRole) {
    storage.setItem("admin_rol", adminRole);
  }
}

export function readCookieValue(cookieName) {
  if (typeof document === "undefined" || !cookieName) {
    return "";
  }

  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const prefix = `${cookieName}=`;
  const match = cookies.find((entry) => entry.startsWith(prefix));

  if (!match) {
    return "";
  }

  return decodeURIComponent(match.slice(prefix.length));
}
