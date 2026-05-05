export const AUTH_RETURN_TO_STORAGE_KEY = "auth:returnTo";

function getLocationOrigin() {
  if (typeof window === "undefined" || !window.location?.origin) {
    return "http://localhost";
  }

  return window.location.origin;
}

export function isSafeReturnToPath(candidate) {
  if (typeof candidate !== "string" || !candidate.trim()) {
    return false;
  }

  try {
    const url = new URL(candidate, getLocationOrigin());
    const isSameOrigin = url.origin === getLocationOrigin();
    const pathWithQuery = `${url.pathname}${url.search}${url.hash}`;

    if (!isSameOrigin) {
      return false;
    }

    if (!pathWithQuery.startsWith("/")) {
      return false;
    }

    return pathWithQuery !== "/cedula";
  } catch {
    return false;
  }
}

export function normalizeReturnTo(candidate) {
  if (!isSafeReturnToPath(candidate)) {
    return null;
  }

  const url = new URL(candidate, getLocationOrigin());
  return `${url.pathname}${url.search}${url.hash}`;
}

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage ?? null;
}

export function saveReturnTo(candidate) {
  const normalized = normalizeReturnTo(candidate);
  const storage = getSessionStorage();

  if (!normalized || !storage) {
    return null;
  }

  storage.setItem(AUTH_RETURN_TO_STORAGE_KEY, normalized);
  return normalized;
}

export function readReturnTo() {
  const storage = getSessionStorage();

  if (!storage) {
    return null;
  }

  return normalizeReturnTo(storage.getItem(AUTH_RETURN_TO_STORAGE_KEY));
}

export function clearReturnTo() {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(AUTH_RETURN_TO_STORAGE_KEY);
}

export function consumeReturnTo() {
  const value = readReturnTo();
  clearReturnTo();
  return value;
}
