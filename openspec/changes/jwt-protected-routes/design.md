# Design: JWT Protected Routes

## Technical Approach

Introduce `src/features/auth/` with three layers: session adapter/storage, React auth provider/hooks, and router guards. `src/main.jsx` becomes the single access-control composition root: public routes (`/`, `/cedula`, `/acceso-denegado`), worker protected routes, and admin protected routes. `src/CedulaIngreso.jsx` will normalize worker/admin login outcomes into one `AuthSession`, trigger session rehydration through `GET /auth/session`, and mirror only legacy profile keys required by existing screens. `src/App.jsx` will stop owning auth state; `/cedula` becomes the canonical login and recovery route, while `/bienvenida` remains the post-login worker context step.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Shared auth state | React Context + reducer in `AuthProvider` | Per-screen `localStorage`; new state library | Auth is app-wide and route-driven, but the repo has no global state dependency. Context keeps one source of truth with minimal churn. |
| Persistence model | `localStorage` key `auth.session.v1` stores UI session metadata only, `sessionStorage` key `auth:returnTo` stores recovery intent | In-memory only; Dexie | Reload recovery is required now, but auth proof must stay server-verifiable. Persisted data helps UX only and MUST NOT be accepted as proof of authentication. |
| Transport model | Cookie-based auth only: backend sets `gm_access` + `gm_refresh` as HttpOnly cookies and `gm_csrf` when CSRF is available; `src/utils/api.js` always uses `withCredentials: true`, attaches `X-CSRF-Token` on unsafe requests when the cookie exists, and emits auth events on `401/403` | Bearer token transport; hybrid bearer+cookie | Backend contract is now confirmed. Keeping tokens out of JS-accessible storage removes the need to persist or inject bearer credentials from the frontend. |
| Local dev transport | Support same-origin `/api` proxy through Vite when local browser cookie/CORS behavior blocks cross-origin auth debugging | Keep direct `http://localhost:3000` calls only | Local debugging revealed browser-only differences between GET and POST auth flows; a same-origin proxy removes CORS/preflight noise without changing production behavior. |

## Data Flow

```text
Deep link -> ProtectedRoute -> save returnTo -> /cedula
/cedula -> CedulaIngreso -> login/PIN/WebAuthn success
         -> GET /auth/session (withCredentials)
         -> authSessionAdapter.normalize()
         -> AuthProvider.signIn() with UI metadata only
         -> syncLegacyProfile()
         -> worker without obra? /bienvenida (keeps returnTo)
         -> admin? returnTo or admin home
/bienvenida -> validates obra/GPS -> returnTo if still valid, else current default flow

Protected API call -> api interceptor -> withCredentials: true
                     -> if method is unsafe and `gm_csrf` cookie exists, attach `X-CSRF-Token`
401 -> optionally POST /auth/refresh (withCredentials) when session recovery is allowed
    -> if refresh fails, clear session metadata + auth legacy keys
    -> emit unauthorized -> /cedula with returnTo
403 -> keep session -> RoleGuard or screen-level error -> /acceso-denegado or inline message
Explicit sign-out -> POST /auth/logout (withCredentials) -> clear session metadata + auth legacy keys -> /cedula
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/features/auth/context/AuthProvider.jsx` | Create | Owns hydration, sign-in, sign-out, and auth status. |
| `src/features/auth/hooks/useAuth.js` | Create | Stable hook for session, role checks, and auth actions. |
| `src/features/auth/storage/authSessionStorage.js` | Create | Reads/writes `auth.session.v1` as UI metadata only, validates shape freshness, clears auth-only legacy keys. |
| `src/features/auth/adapters/authSessionAdapter.js` | Create | Normalizes `GET /auth/session`, refresh aftermath, worker PIN/WebAuthn, and admin login outcomes into one contract. |
| `src/features/auth/routes/ProtectedRoute.jsx` | Create | Blocks anonymous access and preserves `returnTo`. |
| `src/features/auth/routes/RoleGuard.jsx` | Create | Enforces worker/admin role access and handles `403` navigation. |
| `src/features/auth/utils/returnTo.js` | Create | Validates same-origin app paths and persists recovery intent. |
| `src/features/auth/pages/ForbiddenPage.jsx` | Create | Minimal denied-access screen for authenticated-but-unauthorized users. |
| `src/main.jsx` | Modify | Wrap app with `AuthProvider`, group protected routes, remove guest `/bienvenida` bypass. |
| `src/App.jsx` | Modify | Convert root intro flow into splash/redirect logic backed by auth state. |
| `src/CedulaIngreso.jsx` | Modify | Replace direct auth proof writes with provider actions; keep legacy mirror as migration output only. |
| `src/BienvenidaSeleccion.jsx` | Modify | Consume pending `returnTo` after obra validation instead of always using the default landing. |
| `src/utils/api.js` | Modify | Add `withCredentials` defaults, optional CSRF header injection for unsafe requests, auth event bridge, refresh/logout coordination, and normalized 401/403 behavior. |
| `vite.config.js` | Modify | Allow local same-origin API proxy when `VITE_API_BASE_URL` is configured as a relative prefix such as `/api`. |
| `src/features/indicador-central/pages/IndicadorCentralAdminPage.jsx` | Modify | Remove `localStorage`-based gate and trust route guards/auth hook. |

## Interfaces / Contracts

```js
{
  kind: "worker" | "admin",
  roles: ["worker"] | ["admin:gruaman"] | ["admin:bomberman"],
  user: { id, name, documentId, companyId, companySlug, cargo: "" },
  transport: { type: "cookie", cookieNames: ["gm_access", "gm_refresh"], csrfCookie: "gm_csrf" | null },
  sessionStatus: "authenticated" | "anonymous",
  expiresAt: "ISO-8601" | null,
  legacyProfile: {
    nombre_trabajador: "",
    cedula_trabajador: "",
    empresa_id: "",
    empresa_trabajador: "",
    cargo_trabajador: ""
  }
}
```

`AuthSession` is a frontend metadata envelope derived from `GET /auth/session`; it is never itself an authentication proof. `returnTo` must only accept internal paths, must reject `/cedula`, and must survive refresh in the same tab.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Manual routing | Anonymous deep-link, boot-time `GET /auth/session` rehydration, expired/revoked cookies, admin role mismatch, `/cedula` recovery | Browser QA checklist; verify redirects and preserved destinations. |
| Manual API/auth | Protected request with `withCredentials`, unsafe request with CSRF enabled, forced `401`, forced `403`, refresh recovery, explicit logout | Use dev backend/stubbed responses; confirm cookie-based session continuity, invalidation, and deny-without-logout behavior. |
| Quality gate | Router/auth edits compile lint-cleanly | Run `npm run lint`. No automated unit/integration runner exists in this repo today. |

## Migration / Rollout

Phase 1: land auth feature module, protected route groups, and compatibility mirror for legacy keys. Phase 2: migrate existing screens away from auth-related `localStorage` reads (`admin_rol`, guest `/bienvenida`, direct worker identity trust). Legacy keys remain write-only compatibility outputs during the migration; they are never accepted as authentication proof. No service-worker auth caching is added in this change, and no JWT/cookie value is stored in JS-accessible storage.

For local development only, the frontend MAY use a Vite proxy (`/api` -> backend target) to eliminate browser-specific cross-origin cookie/preflight inconsistencies discovered during manual QA. This does not change production deployment or backend contracts.

## Open Questions

- [ ] Backend must confirm the exact `GET /auth/session` response shape (user fields, role array/claims, expiry hints, and whether worker context such as company/obra is included or must be derived elsewhere).
- [ ] Backend must confirm the claim names/role values for Gruaman vs Bomberman admin sessions so `RoleGuard` can map roles without hardcoded guesswork.
