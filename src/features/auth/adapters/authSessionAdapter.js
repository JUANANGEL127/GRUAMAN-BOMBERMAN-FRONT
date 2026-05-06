export const AUTH_COOKIE_NAMES = Object.freeze(["gm_access", "gm_refresh"]);
export const AUTH_CSRF_COOKIE_NAME = "gm_csrf";

const COMPANY_SLUG_BY_ID = Object.freeze({
  1: "GyE",
  2: "AIC",
  3: "Tecnicos",
  4: "SST",
  5: "Lideres",
});

const COMPANY_ALIAS_MAP = Object.freeze({
  gruaman: "GyE",
  "grua man": "GyE",
  "grua-man": "GyE",
  gye: "GyE",
  bomberman: "AIC",
  "bomber man": "AIC",
  "bomber-man": "AIC",
  aic: "AIC",
  tecnicos: "Tecnicos",
  sst: "SST",
  lideres: "Lideres",
  "lider bomba" : "Lideres"
});

const EMPTY_USER = Object.freeze({
  id: "",
  name: "",
  documentId: "",
  companyId: "",
  companySlug: "",
  cargo: "",
});

const EMPTY_LEGACY_PROFILE = Object.freeze({
  nombre_trabajador: "",
  cedula_trabajador: "",
  empresa_id: "",
  empresa_trabajador: "",
  cargo_trabajador: "",
});

export const ANONYMOUS_AUTH_SESSION = Object.freeze({
  kind: null,
  roles: [],
  user: EMPTY_USER,
  transport: {
    type: "cookie",
    cookieNames: AUTH_COOKIE_NAMES,
    csrfCookie: AUTH_CSRF_COOKIE_NAME,
  },
  sessionStatus: "anonymous",
  expiresAt: null,
  legacyProfile: EMPTY_LEGACY_PROFILE,
  authFlow: Object.freeze({}),
});

function pickFirstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return "";
}

function pickFirstBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return undefined;
}

function normalizeIdLike(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function pickPreferredValue(primaryValue, fallbackValue) {
  if (Array.isArray(primaryValue)) {
    return primaryValue.length > 0 ? primaryValue : fallbackValue;
  }

  if (typeof primaryValue === "string") {
    return primaryValue.trim() ? primaryValue : fallbackValue;
  }

  if (primaryValue !== undefined && primaryValue !== null && primaryValue !== "") {
    return primaryValue;
  }

  return fallbackValue;
}

function normalizeRoleToken(role) {
  const normalized = normalizeText(role).toLowerCase();

  if (!normalized) {
    return "";
  }

  if (normalized === "gruaman" || normalized === "bomberman") {
    return `admin:${normalized}`;
  }

  if (normalized === "worker" || normalized === "trabajador") {
    return "worker";
  }

  return normalized;
}

function extractRoleCandidates(root, user) {
  return [
    root?.roles,
    root?.role,
    root?.rol,
    root?.claims?.roles,
    root?.claims?.role,
    root?.permissions,
    user?.roles,
    user?.role,
    user?.rol,
  ];
}

function normalizeRoles(root, user) {
  const roles = extractRoleCandidates(root, user)
    .flatMap((candidate) => {
      if (Array.isArray(candidate)) {
        return candidate;
      }

      if (typeof candidate === "string") {
        return candidate.split(/[,\s]+/).filter(Boolean);
      }

      return [];
    })
    .map(normalizeRoleToken)
    .filter(Boolean);

  return [...new Set(roles)];
}

function unwrapPayload(payload) {
  if (payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }

  return payload ?? {};
}

function extractUser(root) {
  return (
    root?.user ||
    root?.usuario ||
    root?.trabajador ||
    root?.admin ||
    root?.profile ||
    root?.employee ||
    root
  );
}

export function getCompanySlug(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  if (/^\d+$/.test(normalized)) {
    return COMPANY_SLUG_BY_ID[Number(normalized)] ?? normalized;
  }

  return COMPANY_ALIAS_MAP[normalized.toLowerCase()] ?? normalized;
}

function inferKind(root, roles, options) {
  const actorType = normalizeText(
    pickFirstDefined(root?.actorType, root?.actor_type, root?.user?.actorType, root?.user?.actor_type)
  ).toLowerCase();
  if (actorType === "admin" || actorType === "worker") {
    return actorType;
  }

  if (roles.some((role) => role.startsWith("admin:") || role === "admin")) {
    return "admin";
  }

  const explicitAdmin = pickFirstBoolean(root?.isAdmin, root?.admin === true);
  if (explicitAdmin) {
    return "admin";
  }

  if (options.defaultKind) {
    return options.defaultKind;
  }

  return "worker";
}

function inferSessionStatus(root, user, kind, options) {
  const explicitStatus = normalizeText(root?.sessionStatus).toLowerCase();

  if (explicitStatus === "authenticated" || explicitStatus === "anonymous") {
    return explicitStatus;
  }

  const explicitAuth = pickFirstBoolean(root?.authenticated, root?.isAuthenticated, root?.success);
  if (explicitAuth === true) {
    return "authenticated";
  }

  if (explicitAuth === false && !options.authenticatedByDefault) {
    return "anonymous";
  }

  const hasAnyIdentity = Boolean(
    normalizeText(user?.nombre || user?.name || user?.fullName) ||
      normalizeText(user?.numero_identificacion || user?.cedula || user?.documentId) ||
      kind
  );

  if (hasAnyIdentity && options.authenticatedByDefault) {
    return "authenticated";
  }

  return "anonymous";
}

function normalizeLegacyProfile(root, user, kind) {
  const companyId = normalizeIdLike(
    pickFirstDefined(
      user?.companyId,
      user?.empresaId,
      user?.empresa_id,
      root?.companyId,
      root?.empresaId,
      root?.empresa_id
    )
  );
  const companySlug = getCompanySlug(
    pickFirstDefined(
      user?.companySlug,
      user?.empresaSlug,
      user?.empresa_trabajador,
      user?.empresa,
      root?.empresa_trabajador,
      root?.empresa,
      root?.constructora
    ) || companyId
  );

  if (kind !== "worker") {
    return { ...EMPTY_LEGACY_PROFILE };
  }

  return {
    nombre_trabajador: normalizeText(
      pickFirstDefined(
        user?.name,
        user?.nombre,
        user?.nombres,
        user?.nombre_trabajador,
        root?.nombre_trabajador
      )
    ),
    cedula_trabajador: normalizeIdLike(
      pickFirstDefined(
        user?.documentId,
        user?.numeroIdentificacion,
        user?.numero_identificacion,
        user?.cedula,
        root?.cedula_trabajador,
        root?.numeroIdentificacion
      )
    ),
    empresa_id: companyId,
    empresa_trabajador: companySlug,
    cargo_trabajador: normalizeText(
      pickFirstDefined(user?.cargo, user?.cargo_trabajador, user?.puesto, root?.cargo_trabajador)
    ),
  };
}

function normalizeUser(root, user, kind) {
  const companyId = normalizeIdLike(
    pickFirstDefined(
      user?.companyId,
      user?.empresaId,
      user?.empresa_id,
      root?.companyId,
      root?.empresaId,
      root?.empresa_id
    )
  );
  const companySlug = getCompanySlug(
    pickFirstDefined(
      user?.companySlug,
      user?.empresaSlug,
      user?.empresa_trabajador,
      user?.empresa,
      root?.empresa_trabajador,
      root?.empresa,
      root?.constructora
    ) || companyId
  );

  return {
    id: normalizeIdLike(pickFirstDefined(user?.id, user?.user_id, user?.usuario_id, root?.id)),
    name: normalizeText(
      pickFirstDefined(
        user?.name,
        user?.nombre,
        user?.nombres,
        user?.displayName,
        user?.fullName,
        user?.nombre_trabajador,
        root?.name,
        root?.nombre,
        root?.displayName
      )
    ),
    documentId: normalizeIdLike(
      pickFirstDefined(
        user?.documentId,
        user?.numeroIdentificacion,
        user?.numero_identificacion,
        user?.cedula,
        user?.idNumber,
        root?.documentId,
        root?.numeroIdentificacion,
        root?.numero_identificacion,
        root?.cedula
      )
    ),
    companyId,
    companySlug,
    cargo: kind === "worker"
      ? normalizeText(
          pickFirstDefined(user?.cargo, user?.cargo_trabajador, user?.puesto, root?.cargo)
        )
      : "",
  };
}

function normalizeAuthFlow(root) {
  return {
    success: pickFirstBoolean(root?.success, root?.ok, root?.authenticated),
    active: pickFirstBoolean(root?.activo, root?.active, root?.user?.activo, root?.trabajador?.activo),
    pinEnabled:
      pickFirstBoolean(
        root?.pinHabilitado,
        root?.pin_enabled,
        root?.pinEnabled,
        root?.isPinEnabled,
        root?.is_pin_enabled
      ) ?? false,
    pinConfigured:
      pickFirstBoolean(
        root?.pinConfigurado,
        root?.pin_configurado,
        root?.pinConfigured,
        root?.isPinConfigured,
        root?.is_pin_configured
      ) ?? false,
    hasCredential:
      pickFirstBoolean(
        root?.hasCredential,
        root?.has_credential,
        root?.credentialRegistered,
        root?.has_credential_registered,
        root?.hasCredentialRegistered
      ) ?? false,
    errorMessage: normalizeText(
      pickFirstDefined(root?.error, root?.message, root?.detail, root?.mensaje)
    ),
  };
}

export function normalizeAuthSession(payload, options = {}) {
  const root = unwrapPayload(payload);
  const userSource = extractUser(root);
  const roles = normalizeRoles(root, userSource);
  const kind = inferKind(root, roles, {
    defaultKind: options.defaultKind,
  });
  const user = normalizeUser(root, userSource, kind);
  const legacyProfile = normalizeLegacyProfile(root, userSource, kind);
  const sessionStatus = inferSessionStatus(root, userSource, kind, {
    authenticatedByDefault: options.authenticatedByDefault ?? true,
  });

  return {
    kind,
    roles,
    user,
    transport: {
      type: "cookie",
      cookieNames: AUTH_COOKIE_NAMES,
      csrfCookie: AUTH_CSRF_COOKIE_NAME,
    },
    sessionStatus,
    expiresAt: normalizeText(pickFirstDefined(root?.expiresAt, root?.exp, root?.session_expires_at)) || null,
    legacyProfile,
    authFlow: {
      ...normalizeAuthFlow(root),
      source: options.source ?? "unknown",
    },
  };
}

export function normalizeSessionResponse(payload) {
  return normalizeAuthSession(payload, {
    source: "auth/session",
    authenticatedByDefault: true,
  });
}

export function normalizeRefreshResponse(payload) {
  return normalizeAuthSession(payload, {
    source: "auth/refresh",
    authenticatedByDefault: true,
  });
}

export function normalizeAdminLoginResponse(payload) {
  return normalizeAuthSession(payload, {
    source: "admin/login",
    defaultKind: "admin",
    authenticatedByDefault: true,
  });
}

export function normalizePinStatusResponse(payload) {
  return normalizeAuthSession(payload, {
    source: "auth/pin/status",
    defaultKind: "worker",
    authenticatedByDefault: false,
  });
}

export function normalizePinVerifyResponse(payload) {
  return normalizeAuthSession(payload, {
    source: "auth/pin/verify",
    defaultKind: "worker",
    authenticatedByDefault: true,
  });
}

export function normalizePinSetResponse(payload) {
  return normalizeAuthSession(payload, {
    source: "auth/pin/set",
    defaultKind: "worker",
    authenticatedByDefault: true,
  });
}

export function mergeAuthSessions(primary, fallback) {
  if (!fallback) {
    return primary;
  }

  const nextPrimary = primary ?? ANONYMOUS_AUTH_SESSION;
  const nextFallback = fallback ?? ANONYMOUS_AUTH_SESSION;

  return {
    ...nextFallback,
    ...nextPrimary,
    kind: nextPrimary.kind ?? nextFallback.kind,
    roles: [...new Set([...(nextFallback.roles ?? []), ...(nextPrimary.roles ?? [])])],
    user: {
      ...nextFallback.user,
      ...nextPrimary.user,
      id: pickPreferredValue(nextPrimary.user?.id, nextFallback.user?.id ?? ""),
      name: pickPreferredValue(nextPrimary.user?.name, nextFallback.user?.name ?? ""),
      documentId: pickPreferredValue(
        nextPrimary.user?.documentId,
        nextFallback.user?.documentId ?? ""
      ),
      companyId: pickPreferredValue(nextPrimary.user?.companyId, nextFallback.user?.companyId ?? ""),
      companySlug: pickPreferredValue(
        nextPrimary.user?.companySlug,
        nextFallback.user?.companySlug ?? ""
      ),
      cargo: pickPreferredValue(nextPrimary.user?.cargo, nextFallback.user?.cargo ?? ""),
    },
    transport: {
      ...nextFallback.transport,
      ...nextPrimary.transport,
      type: pickPreferredValue(nextPrimary.transport?.type, nextFallback.transport?.type ?? "cookie"),
      cookieNames: pickPreferredValue(
        nextPrimary.transport?.cookieNames,
        nextFallback.transport?.cookieNames ?? AUTH_COOKIE_NAMES
      ),
      csrfCookie: pickPreferredValue(
        nextPrimary.transport?.csrfCookie,
        nextFallback.transport?.csrfCookie ?? AUTH_CSRF_COOKIE_NAME
      ),
    },
    legacyProfile: {
      ...nextFallback.legacyProfile,
      ...nextPrimary.legacyProfile,
      nombre_trabajador: pickPreferredValue(
        nextPrimary.legacyProfile?.nombre_trabajador,
        nextFallback.legacyProfile?.nombre_trabajador ?? ""
      ),
      cedula_trabajador: pickPreferredValue(
        nextPrimary.legacyProfile?.cedula_trabajador,
        nextFallback.legacyProfile?.cedula_trabajador ?? ""
      ),
      empresa_id: pickPreferredValue(
        nextPrimary.legacyProfile?.empresa_id,
        nextFallback.legacyProfile?.empresa_id ?? ""
      ),
      empresa_trabajador: pickPreferredValue(
        nextPrimary.legacyProfile?.empresa_trabajador,
        nextFallback.legacyProfile?.empresa_trabajador ?? ""
      ),
      cargo_trabajador: pickPreferredValue(
        nextPrimary.legacyProfile?.cargo_trabajador,
        nextFallback.legacyProfile?.cargo_trabajador ?? ""
      ),
    },
    authFlow: {
      ...nextFallback.authFlow,
      ...nextPrimary.authFlow,
      success: nextPrimary.authFlow?.success ?? nextFallback.authFlow?.success ?? false,
      active: nextPrimary.authFlow?.active ?? nextFallback.authFlow?.active,
      pinEnabled:
        nextPrimary.authFlow?.pinEnabled ?? nextFallback.authFlow?.pinEnabled ?? false,
      pinConfigured:
        nextPrimary.authFlow?.pinConfigured ??
        nextFallback.authFlow?.pinConfigured ??
        false,
      hasCredential:
        nextPrimary.authFlow?.hasCredential ?? nextFallback.authFlow?.hasCredential ?? false,
      errorMessage: pickPreferredValue(
        nextPrimary.authFlow?.errorMessage,
        nextFallback.authFlow?.errorMessage ?? ""
      ),
      source: pickPreferredValue(nextPrimary.authFlow?.source, nextFallback.authFlow?.source ?? ""),
    },
    sessionStatus:
      nextPrimary.sessionStatus === "authenticated" || nextFallback.sessionStatus !== "authenticated"
        ? nextPrimary.sessionStatus
        : nextFallback.sessionStatus,
    expiresAt: nextPrimary.expiresAt || nextFallback.expiresAt || null,
  };
}

export function isAuthenticatedAuthSession(session) {
  return session?.sessionStatus === "authenticated";
}

export function getLegacyAdminRole(session) {
  const role = session?.roles?.find((candidate) => candidate.startsWith("admin:")) ?? "";
  return role.replace("admin:", "");
}

export function getSessionHomePath(session) {
  if (session?.kind !== "admin") {
    return "/bienvenida";
  }

  const adminRole = getLegacyAdminRole(session);

  if (adminRole === "bomberman") {
    return "/administrador_bomberman";
  }

  return "/administrador";
}

export function toWorkerCompatibilityUser(session) {
  return {
    id: session?.user?.id || "",
    nombre: session?.legacyProfile?.nombre_trabajador || session?.user?.name || "",
    numero_identificacion:
      session?.legacyProfile?.cedula_trabajador || session?.user?.documentId || "",
    empresa: session?.legacyProfile?.empresa_trabajador || session?.user?.companySlug || "",
    empresa_id: session?.legacyProfile?.empresa_id || session?.user?.companyId || "",
    cargo: session?.legacyProfile?.cargo_trabajador || session?.user?.cargo || "",
  };
}
