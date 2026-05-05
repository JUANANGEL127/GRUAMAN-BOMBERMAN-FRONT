/**
 * Central Axios transport with cookie-based auth coordination.
 *
 * This module intentionally keeps tokens out of JavaScript-accessible storage.
 * Authentication proof lives in HttpOnly cookies managed by the backend.
 */
import axios from "axios";
import {
  clearAuthSessionStorage,
  readCookieValue,
} from "../features/auth/storage/authSessionStorage";
import { AUTH_EVENTS, emitAuthEvent } from "../features/auth/utils/authEvents";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://gruaman-bomberman-back.onrender.com";

const CSRF_COOKIE_NAME = "gm_csrf";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const UNSAFE_METHODS = new Set(["post", "put", "patch", "delete"]);
const AUTH_CONTROL_PATHS = [
  "/auth/session",
  "/auth/refresh",
  "/auth/logout",
  "/admin/login",
  "/auth/pin/status",
  "/auth/pin/verify",
  "/auth/pin/set",
  "/webauthn/register/options",
  "/webauthn/register/verify",
  "/webauthn/authenticate/options",
  "/webauthn/authenticate/verify",
  "/webauthn/hasCredential",
];

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const authTransport = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshRequestPromise = null;
let logoutRequestPromise = null;

function getRequestMethod(config = {}) {
  return String(config.method ?? "get").toLowerCase();
}

function resolveRequestPath(config = {}) {
  const rawUrl = String(config.url ?? "").trim();

  if (!rawUrl) {
    return "/";
  }

  try {
    if (/^https?:\/\//i.test(rawUrl)) {
      return new URL(rawUrl).pathname;
    }

    return rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  } catch {
    return rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  }
}

function isAuthControlRequest(config = {}) {
  const path = resolveRequestPath(config);
  return AUTH_CONTROL_PATHS.some((candidate) => path.startsWith(candidate));
}

function shouldAttachCsrf(config = {}) {
  return UNSAFE_METHODS.has(getRequestMethod(config));
}

function withCsrfHeader(config = {}) {
  const nextConfig = {
    ...config,
    withCredentials: true,
    headers: {
      ...(config.headers ?? {}),
    },
  };

  if (!shouldAttachCsrf(nextConfig)) {
    return nextConfig;
  }

  const csrfToken = readCookieValue(CSRF_COOKIE_NAME);
  if (csrfToken && !nextConfig.headers[CSRF_HEADER_NAME]) {
    nextConfig.headers[CSRF_HEADER_NAME] = csrfToken;
  }

  return nextConfig;
}

function normalizeAuthError(error, flags = {}) {
  if (error?.response?.status === 401) {
    error.isAuthUnauthorized = true;
  }

  if (error?.response?.status === 403) {
    error.isAuthForbidden = true;
  }

  Object.assign(error, flags);
  return error;
}

function clearAuthStateAndEmit(eventType, detail = {}) {
  clearAuthSessionStorage();
  emitAuthEvent(eventType, detail);
}

[api, authTransport].forEach((instance) => {
  instance.interceptors.request.use((config) => withCsrfHeader(config));
});

export function isUnauthorizedError(error) {
  return Boolean(error?.isAuthUnauthorized || error?.response?.status === 401);
}

export function isForbiddenError(error) {
  return Boolean(error?.isAuthForbidden || error?.response?.status === 403);
}

export async function getAuthSession({ reason = "auth/session" } = {}) {
  return authTransport.get("/auth/session", {
    meta: {
      reason,
    },
  });
}

export async function refreshAuthSession({ reason = "refresh" } = {}) {
  if (!refreshRequestPromise) {
    refreshRequestPromise = authTransport
      .post(
        "/auth/refresh",
        {},
        {
          meta: {
            reason,
          },
        }
      )
      .finally(() => {
        refreshRequestPromise = null;
      });
  }

  return refreshRequestPromise;
}

export async function logoutAuthSession({ reason = "logout" } = {}) {
  if (!logoutRequestPromise) {
    logoutRequestPromise = authTransport
      .post(
        "/auth/logout",
        {},
        {
          meta: {
            reason,
          },
        }
      )
      .catch((error) => normalizeAuthError(error))
      .finally(() => {
        clearAuthStateAndEmit(AUTH_EVENTS.SIGNED_OUT, { reason });
        logoutRequestPromise = null;
      });
  }

  return logoutRequestPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config ?? {};
    const path = resolveRequestPath(originalRequest);

    if (error?.response?.status === 403) {
      emitAuthEvent(AUTH_EVENTS.FORBIDDEN, {
        path,
        error,
      });

      return Promise.reject(normalizeAuthError(error));
    }

    if (error?.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (
      originalRequest._retry ||
      originalRequest.skipAuthHandling ||
      isAuthControlRequest(originalRequest)
    ) {
      return Promise.reject(normalizeAuthError(error));
    }

    try {
      await refreshAuthSession({
        reason: `response-401:${path}`,
      });

      originalRequest._retry = true;
      return api.request(originalRequest);
    } catch (refreshError) {
      clearAuthStateAndEmit(AUTH_EVENTS.UNAUTHORIZED, {
        path,
        error: refreshError,
      });

      return Promise.reject(
        normalizeAuthError(error, {
          refreshFailed: true,
        })
      );
    }
  }
);

export default api;
