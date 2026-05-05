# Exploration — jwt-protected-routes

Date: 2026-04-24
Project: gruaman-bomberman-front
Mode: interactive
Artifact store: hybrid

## Goal

Explore how the frontend currently handles authentication, route access, and session persistence so we can design JWT-protected private routes without breaking the existing worker/admin flows.

## Assumptions

- This exploration is limited to the local frontend repository.
- Backend behavior is inferred only from the frontend contracts/endpoints currently consumed.
- No feature code was implemented in this phase.

## Findings

### 1. Current login/authentication flow and where session-like data is stored

#### Worker flow

- Root route `/` renders `App`, which keeps login state only in local React state: `const [usuario, setUsuario] = useState(null)` and conditionally shows `CedulaIngreso` or `BienvenidaSeleccion` (`src/App.jsx:21-23`, `src/App.jsx:57-63`).
- `CedulaIngreso` authenticates a worker by:
  - fetching `/datos_basicos`,
  - finding the worker by ID and `activo === true`,
  - then branching into PIN or WebAuthn flows,
  - and finally calling `handleUsuarioAutenticado(...)` (`src/CedulaIngreso.jsx:104-117`, `src/CedulaIngreso.jsx:141-151`, `src/CedulaIngreso.jsx:184-227`, `src/CedulaIngreso.jsx:326-366`).
- Before authentication fully completes, the component already persists multiple user fields in `localStorage`: `usuario`, `nombre_trabajador`, `cedula_trabajador`, `cedula`, `cargo_trabajador`, `empresa_trabajador`, `obra`, `nombre_proyecto` (`src/CedulaIngreso.jsx:120-136`).
- After successful auth it persists more state via `handleUsuarioAutenticado`, including `nombre_trabajador`, `cedula_trabajador`, `empresa_id` (`src/CedulaIngreso.jsx:66-70`).
- `BienvenidaSeleccion` persists more session-like context in `localStorage` and then, after `/validar_ubicacion`, writes `obra`, `obra_id`, `constructora`, `nombre_proyecto`, and `selectedCharacter` before navigating into the app (`src/BienvenidaSeleccion.jsx:57-69`, `src/BienvenidaSeleccion.jsx:102-116`, `src/BienvenidaSeleccion.jsx:137-172`).

#### Admin flow

- Admin login is a single POST to `/admin/login` with only `{ password }` and, on success, the frontend stores `admin_rol` in `localStorage` and redirects with `window.location.href` (`src/CedulaIngreso.jsx:240-268`).
- No access token, refresh token, session cookie handling, or token rehydration logic exists in the frontend codebase.

#### Important flow gap

- The standalone `/cedula` route renders `<CedulaIngreso />` without `onUsuarioEncontrado` (`src/main.jsx:1027-1029`).
- `CedulaIngreso` only completes the worker flow by calling the optional callback; it does not self-navigate after worker auth (`src/CedulaIngreso.jsx:65-70`).
- Result: redirecting invalid sessions to `/cedula` is not enough today for worker recovery unless the component is refactored.

### 2. Current private routes and detected bypasses

- The router mounts a large number of application and admin routes directly in `src/main.jsx` with no shared `ProtectedRoute`, `RequireAuth`, auth context, or auth provider (`src/main.jsx:1011-1072`; repo search found no `ProtectedRoute`, `PrivateRoute`, `RequireAuth`, `useAuth`, or `AuthProvider` in `src/`).
- Only `/indicador-central-admin` has a guard, and it is purely client-side: it reads `window.localStorage.getItem("admin_rol")` and redirects to `/cedula` if the value is missing or unexpected (`src/features/indicador-central/pages/IndicadorCentralAdminPage.jsx:167-180`).
- Admin entry routes like `/administrador` and `/administrador_bomberman` are directly mounted in the router and the components themselves do not validate auth before rendering (`src/main.jsx:1032`, `src/main.jsx:1051`, `src/components/administrador_gruaman/administrador.jsx:8-29`).
- Example bypasses:
  - Direct URL access to most admin/report routes is possible because they are mounted as plain routes (`src/main.jsx:1045-1065`).
  - `/bienvenida` can be opened directly with a hardcoded guest-like user object `{ nombre: "Invitado", empresa: "GyE" }`, which bypasses the intended login UI and can continue to geolocation/worksite validation (`src/main.jsx:1029`).
  - Game routes use only `selectedCharacter` as gate; `GameFlow` redirects only when that local key is missing, not when a real session is invalid (`src/components/game/GameFlow.jsx:30-37`).
  - Form routes such as `/hora_salida` load worker data from `localStorage` with empty-string fallbacks instead of rejecting unauthenticated access (`src/components/compartido/hora_salida.jsx:11-18`, `src/components/compartido/hora_salida.jsx:36-53`).

### 3. Backend auth/JWT consumption vs partial validation

- Worker auth currently consumes backend endpoints for identity checks and challenge verification:
  - `/datos_basicos`
  - `/auth/pin/status`
  - `/auth/pin/set`
  - `/auth/pin/verify`
  - `/webauthn/hasCredential`
  - `/webauthn/authenticate/*`
  - `/webauthn/register/*`
  (`src/CedulaIngreso.jsx:111-142`, `src/CedulaIngreso.jsx:186-227`, `src/CedulaIngreso.jsx:326-366`, `src/components/webauthn.js:140-215`)
- But the frontend does not consume JWTs today:
  - repo search found no `Authorization`, `Bearer`, `access_token`, `refresh_token`, `jwt`, or `interceptors` matches in `src/`.
  - the central Axios instance is only `axios.create({ baseURL })`, with no auth interceptors (`src/utils/api.js:10-18`).
  - even the more modular Indicador Central services call `api.get/post/put(...)` with no auth augmentation (`src/features/indicador-central/services/indicadorCentralService.js:1-35`).
- WebAuthn verify returns JSON, but `CedulaIngreso` ignores the returned payload and only treats success as a boolean gate before writing localStorage (`src/components/webauthn.js:210-215`, `src/CedulaIngreso.jsx:203-227`).
- PIN verify also checks only `res.data.success`, with no token/session materialization (`src/CedulaIngreso.jsx:343-366`).

### 4. Frontend pieces that would need to change

#### Router / route protection

- Add a shared route guard layer at the router level instead of per-page checks in random places.
- Group protected areas at minimum into:
  - worker-authenticated routes,
  - admin-authenticated routes,
  - optionally role-scoped admin routes.
- Remove the hardcoded guest access on `/bienvenida` or convert it into a real post-login container.

#### Auth state / rehydration

- Introduce a centralized auth module (`context` + hook or equivalent lightweight store) because current auth state is fragmented across 242 `localStorage` references and 9 `sessionStorage` references in `src/`.
- Rehydrate auth from a verifiable source on app boot; today `App` starts with `usuario = null` and does not restore a session (`src/App.jsx:21-23`, `src/App.jsx:57-63`).
- Keep a compatibility adapter for legacy keys during migration because many forms still read `nombre_trabajador`, `obra`, `empresa_id`, `selectedCharacter`, etc. directly.

#### HTTP client / interceptors

- Upgrade `src/utils/api.js` into the single auth-aware transport:
  - request auth injection (or `withCredentials` if cookie-based),
  - 401/403 handling,
  - refresh coordination,
  - logout side effects.
- Migrate raw `axios`/`fetch` calls gradually toward that client.

#### Login adapters and normalization

- Normalize auth responses from:
  - worker PIN/WebAuthn flows,
  - admin login flow,
  into one frontend-facing session contract (`user`, `role`, `claims`, `expiresAt`, etc.).
- Current worker/admin flows are divergent and store unrelated keys.

#### Logout / expiry / deep links

- Add explicit logout; repo search found no logout implementation in `src/`.
- Add expiry handling; current frontend has no token/session expiration logic.
- Preserve attempted route on redirect and restore it after login.
- Fix the `/cedula` recovery path so a redirected worker can actually complete login from that route.

### 5. Backend dependencies / contracts that seem necessary or uncertain

#### Necessary for real JWT-protected routes

- A backend-issued access token contract or secure server session equivalent.
- A way to validate/rebuild session on app startup, e.g. `/auth/me` or `/auth/session`.
- A refresh strategy if access tokens are short-lived.
- A logout/revocation contract if backend wants server-controlled invalidation.
- Role claims for at least:
  - worker vs admin,
  - admin scope (`gruaman`, `bomberman`, or both),
  - optionally `empresa_id` and finer permissions.

#### Strongly suggested backend PRD work

- Decide whether current auth endpoints should be extended or wrapped:
  - `POST /auth/pin/verify` could return session material.
  - `POST /webauthn/authenticate/verify` could return session material.
  - `POST /admin/login` likely needs a stronger identity model than password-only.
- Define token transport explicitly:
  - **httpOnly cookie**: safer against XSS, but the frontend currently points to a cross-origin Render API by default (`src/utils/api.js:13-17`, `src/CedulaIngreso.jsx:6`), so CORS + `credentials` + `SameSite=None; Secure` need to be designed.
  - **Bearer access token**: simpler cross-origin story, but risky if stored in `localStorage`; would require a safer storage strategy.
- Clarify whether geolocation/worksite validation (`/validar_ubicacion`) happens before or after auth/session issuance. Today it happens after local auth success and before route entry (`src/BienvenidaSeleccion.jsx:137-172`).

### 6. PWA/offline and direct-refresh risks

- The service worker only custom-handles navigation requests and falls back to `caches.match('/index.html')` when offline (`public/sw.js:81-94`).
- Repo search found no `precacheAndRoute`, `self.__WB_MANIFEST`, `caches.open`, or manual cache population; only `caches.match('/index.html')` appears in the SW.
- That means offline recovery for deep links is uncertain: the fallback asks for `/index.html`, but this file is not obviously precached by the checked-in service worker code.
- Because route protection is mostly client-side and storage-based, a direct refresh on a “protected” route can still render the route component if the path exists and the component has no guard.
- If JWT protection is added, refresh behavior becomes critical:
  - online: app must rehydrate session before deciding route access,
  - offline: app must fail safely and avoid exposing stale protected shells if auth cannot be validated.

### 7. Recommended strategy

## Recommendation: incremental refactor, not full replacement

Why:

- The app is heavily coupled to legacy `localStorage` keys across many screens.
- There is no existing centralized auth abstraction to swap in one step.
- Routes are flat and broad; a full replacement would create unnecessary blast radius.

### Suggested sequence

1. **Create an auth contract and storage adapter**
   - Centralize session read/write/clear.
   - Keep legacy localStorage compatibility for existing forms during migration.

2. **Introduce router-level guards**
   - Start with admin routes first because they are the most obviously exposed.
   - Then cover worker routes and game routes.

3. **Unify HTTP auth handling**
   - Move toward one auth-aware API client.
   - Standardize 401/403 + refresh/logout behavior.

4. **Refactor login outputs**
   - Make PIN/WebAuthn/admin login resolve the same normalized session shape.
   - Fix `/cedula` so it can stand alone as a real login recovery route.

5. **Only then remove legacy bypasses**
   - `/bienvenida` guest injection,
   - direct admin route access,
   - per-page localStorage trust for authorization.

## Evidence summary

- Router is flat and mostly unguarded: `src/main.jsx:1011-1072`
- Root auth state is ephemeral: `src/App.jsx:21-23`, `src/App.jsx:57-63`
- Worker login writes localStorage and does not create JWT/session material: `src/CedulaIngreso.jsx:120-136`, `src/CedulaIngreso.jsx:223-227`, `src/CedulaIngreso.jsx:343-366`
- Admin login trusts password-only response and stores `admin_rol` in localStorage: `src/CedulaIngreso.jsx:244-257`
- Only one admin page checks access, and only via localStorage: `src/features/indicador-central/pages/IndicadorCentralAdminPage.jsx:174-180`
- API client has no interceptors/auth support: `src/utils/api.js:10-18`
- PWA deep-link offline fallback is weak/uncertain: `public/sw.js:81-94`

## Open questions for next phases

1. Should backend issue JWTs directly from existing PIN/WebAuthn verify endpoints, or should frontend call a second session-exchange endpoint after successful verification?
2. Do admin users need unique identities, or is shared-password admin access still a hard requirement?
3. Will auth use cookies or bearer tokens across origins?
4. Which routes are truly private in v1:
   - admin only,
   - worker-only post-login,
   - worksite-validated only,
   - game routes only?
