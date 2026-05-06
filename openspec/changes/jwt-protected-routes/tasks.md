# Tasks: JWT Protected Routes

## Phase 1: Contract and session foundation

- [x] 1.1 Create `src/features/auth/adapters/authSessionAdapter.js` to normalize `/auth/session`, `/auth/refresh`, `/admin/login`, `/auth/pin/status`, `/auth/pin/verify`, and `/auth/pin/set` outcomes into one `AuthSession`.
- [x] 1.2 Create `src/features/auth/storage/authSessionStorage.js` and `src/features/auth/utils/returnTo.js` for `auth.session.v1` UI metadata, `auth:returnTo`, freshness checks, same-origin route validation, and auth-only legacy-key cleanup without storing any token in JS-accessible storage.
- [x] 1.3 Create `src/features/auth/context/AuthProvider.jsx` and `src/features/auth/hooks/useAuth.js` to bootstrap from `GET /auth/session`, expose signIn/signOut helpers, treat local persistence as non-auth metadata, and coordinate refresh/logout.
- [x] 1.4 Refactor `src/utils/api.js` to enforce `withCredentials: true`, optional CSRF header injection for unsafe requests when `AUTH_CSRF_ENABLED=true`, single-flight `POST /auth/refresh`, `POST /auth/logout`, and normalized `401`/`403` handling.

## Phase 2: Login and worker/admin entry flows

- [x] 2.1 Refactor `src/CedulaIngreso.jsx` to stop using unauthenticated `GET /datos_basicos`; derive worker/admin identity from successful PIN/WebAuthn flows plus `/auth/session`, then hand off through `AuthProvider`.
- [x] 2.2 Update `src/components/webauthn.js` and `src/CedulaIngreso.jsx` so successful WebAuthn completion through `/webauthn/authenticate/verify` or `/webauthn/register/verify` rehydrates the session through `/auth/session` and never trusts legacy `localStorage` as auth proof.
- [x] 2.3 Keep legacy profile keys write-only in `src/CedulaIngreso.jsx` via the adapter so existing worker screens still receive `nombre_trabajador`, `cedula_trabajador`, `empresa_trabajador`, and `cargo_trabajador` after valid login only.

## Phase 3: Protected routing and recovery wiring

- [x] 3.1 Create `src/features/auth/routes/ProtectedRoute.jsx`, `src/features/auth/routes/RoleGuard.jsx`, and `src/features/auth/pages/ForbiddenPage.jsx` for anonymous redirect, role enforcement, and `/acceso-denegado`.
- [x] 3.2 Rework `src/main.jsx` to mount `AuthProvider`, split public/worker/admin route groups, protect `/bienvenida`, `/game/*`, worker form routes, `/administrador*`, and `/indicador-central-admin`, and remove guest `/bienvenida` access.
- [x] 3.3 Refactor `src/App.jsx` so `/` becomes intro/splash plus session recovery only, while `/cedula` remains the canonical login/recovery entrypoint.
- [x] 3.4 Update `src/BienvenidaSeleccion.jsx` to preserve pending `returnTo`, keep obra/GPS as the worker context step, and resume the intended deep link after validation.
- [x] 3.5 Remove `admin_rol` trust from `src/features/indicador-central/pages/IndicadorCentralAdminPage.jsx`; rely on `useAuth` and route guards instead.

## Phase 4: Verification

- [x] 4.1 Run `npm run lint` after auth, routing, and API changes; fix auth-slice regressions and document repo-wide historical lint debt blocking a full green run.
- [x] 4.2 Execute manual QA for: anonymous deep-link to `/game/world-map`, boot-time `GET /auth/session` rehydration with valid cookies, forced `401` with failed refresh to `/cedula`, forced `403` to `/acceso-denegado`, admin login to the correct admin home, worker login through `/bienvenida` back to the requested route, unsafe request with `AUTH_CSRF_ENABLED=true`, and explicit logout through `POST /auth/logout`.

## Notes

- `GET /datos_basicos` is now admin-only, so worker pre-auth identity can no longer depend on that call.
- Remaining backend alignment gap is the exact `GET /auth/session` response shape and the precise admin claim names/role values used to distinguish Gruaman vs Bomberman access.
- `npm run lint` was executed on April 29, 2026 and remains blocked by pre-existing repo-wide ESLint debt outside the jwt-protected-routes write set; targeted ESLint for the auth/routing slices passed.
- Manual QA summary for 4.2 (May 4, 2026): anonymous deep-link, rehydration, 403-without-logout, admin home, and logout passed; forced 401 still redirected to `/cedula` but no refresh request was observed; worker `returnTo` became non-representative under the new protected flow and should be treated as partial/N/A unless a new scenario is defined.
- Local browser debugging exposed cross-origin inconsistencies for some protected POST requests; the frontend now supports an optional same-origin Vite proxy (`VITE_API_BASE_URL=/api`) so local QA can isolate auth behavior without changing production contracts.
