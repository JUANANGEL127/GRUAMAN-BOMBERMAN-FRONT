import React, { createContext, useCallback, useEffect, useMemo, useReducer } from "react";
import {
  ANONYMOUS_AUTH_SESSION,
  isAuthenticatedAuthSession,
  mergeAuthSessions,
  normalizeRefreshResponse,
  normalizeSessionResponse,
} from "../adapters/authSessionAdapter";
import {
  clearAuthSessionStorage,
  readAuthSessionMetadata,
  syncLegacySessionKeys,
  writeAuthSessionMetadata,
} from "../storage/authSessionStorage";
import { AUTH_EVENTS, subscribeAuthEvent } from "../utils/authEvents";
import { getAuthSession, logoutAuthSession, refreshAuthSession } from "../../../utils/api";

const AuthContext = createContext(undefined);

function getInitialState() {
  const storedSession = readAuthSessionMetadata();

  return {
    status: storedSession ? "hydrating" : "idle",
    session: storedSession ?? ANONYMOUS_AUTH_SESSION,
    error: null,
    isReady: false,
  };
}

function authReducer(state, action) {
  switch (action.type) {
    case "HYDRATE_START":
      return {
        ...state,
        status: "hydrating",
        error: null,
      };
    case "AUTHENTICATED":
      return {
        status: "authenticated",
        session: action.session,
        error: null,
        isReady: true,
      };
    case "ANONYMOUS":
      return {
        status: "anonymous",
        session: ANONYMOUS_AUTH_SESSION,
        error: action.error ?? null,
        isReady: true,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children, autoHydrate = true }) {
  const [state, dispatch] = useReducer(authReducer, undefined, getInitialState);

  const persistAuthenticatedSession = useCallback((session, source) => {
    writeAuthSessionMetadata(session, { source });
    syncLegacySessionKeys(session);
  }, []);

  const transitionToAnonymous = useCallback((error = null) => {
    clearAuthSessionStorage();
    dispatch({ type: "ANONYMOUS", error });
  }, []);

  const rehydrate = useCallback(
    async ({ hintSession = null, reason = "auth/session" } = {}) => {
      dispatch({ type: "HYDRATE_START" });

      try {
        const response = await getAuthSession({ reason });
        const normalizedSession = mergeAuthSessions(
          normalizeSessionResponse(response.data),
          hintSession
        );

        if (isAuthenticatedAuthSession(normalizedSession)) {
          persistAuthenticatedSession(normalizedSession, reason);
          dispatch({ type: "AUTHENTICATED", session: normalizedSession });
          return normalizedSession;
        }

        const fallbackSession =
          hintSession && isAuthenticatedAuthSession(hintSession)
            ? mergeAuthSessions(hintSession, normalizedSession)
            : null;

        if (fallbackSession && isAuthenticatedAuthSession(fallbackSession)) {
          persistAuthenticatedSession(fallbackSession, reason);
          dispatch({ type: "AUTHENTICATED", session: fallbackSession });
          return fallbackSession;
        }

        transitionToAnonymous();
        return ANONYMOUS_AUTH_SESSION;
      } catch (error) {
        transitionToAnonymous(error);
        throw error;
      }
    },
    [persistAuthenticatedSession, transitionToAnonymous]
  );

  const signIn = useCallback(
    async ({ hintSession = null, source = "sign-in" } = {}) =>
      rehydrate({
        hintSession,
        reason: source,
      }),
    [rehydrate]
  );

  const signOut = useCallback(
    async ({ reason = "manual-sign-out" } = {}) => {
      try {
        await logoutAuthSession({ reason });
      } finally {
        transitionToAnonymous();
      }
    },
    [transitionToAnonymous]
  );

  const refresh = useCallback(
    async ({ reason = "manual-refresh" } = {}) => {
      const response = await refreshAuthSession({ reason });
      const hintSession = normalizeRefreshResponse(response.data);
      return rehydrate({
        hintSession,
        reason: `${reason}:rehydrate`,
      });
    },
    [rehydrate]
  );

  useEffect(() => {
    if (!autoHydrate) {
      return undefined;
    }

    rehydrate({ reason: "provider-bootstrap" }).catch(() => {
      // The provider fails closed and stays anonymous when session bootstrapping fails.
    });

    return undefined;
  }, [autoHydrate, rehydrate]);

  useEffect(() => {
    const unsubscribeUnauthorized = subscribeAuthEvent(AUTH_EVENTS.UNAUTHORIZED, () => {
      transitionToAnonymous();
    });
    const unsubscribeSignedOut = subscribeAuthEvent(AUTH_EVENTS.SIGNED_OUT, () => {
      transitionToAnonymous();
    });

    return () => {
      unsubscribeUnauthorized();
      unsubscribeSignedOut();
    };
  }, [transitionToAnonymous]);

  const value = useMemo(
    () => ({
      ...state,
      session: state.session,
      user: state.session?.user ?? ANONYMOUS_AUTH_SESSION.user,
      kind: state.session?.kind ?? null,
      roles: state.session?.roles ?? [],
      isAuthenticated: isAuthenticatedAuthSession(state.session),
      isHydrating: state.status === "hydrating",
      signIn,
      signOut,
      refresh,
      rehydrate,
      hasRole: (role) => (state.session?.roles ?? []).includes(role),
    }),
    [refresh, rehydrate, signIn, signOut, state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
