# Proposal: JWT Protected Routes

## Intent
Close client-side auth bypasses and enforce verifiable access for worker/admin routes without breaking current login flows. Frontend is phase 1; backend contracts are prerequisites, not implemented here.

## Scope
### In Scope
- Central auth/session contract, storage adapter, rehydration, logout/expiry handling.
- Router-level guards for worker/admin areas, redirect recovery, and removal of guest/admin bypasses.
- Auth-aware API client and normalized login outputs for PIN, WebAuthn, and admin flows.

### Out of Scope
- Real offline auth/session support or assuming current offline access works.
- Backend implementation details, token issuance internals, or full legacy storage cleanup.

## Capabilities
### New Capabilities
- `jwt-session-management`: Centralize session state, rehydrate on boot, handle expiry/logout, and preserve legacy key compatibility during migration.
- `protected-route-access`: Guard worker/admin routes, preserve intended deep link, and block `/bienvenida` guest/admin `localStorage` bypasses.
- `auth-aware-api-client`: Add auth transport, 401/403 handling, and refresh/logout coordination in one client.

### Modified Capabilities
- None. No relevant auth capability spec exists in `openspec/specs/`; only `prd-frontend-indicador-central.md` was found and it is not an auth contract.

## Approach
Incremental frontend-first refactor: add a shared auth module, migrate login outputs into one session model, protect admin routes first, then worker/game routes, and keep a compatibility adapter for legacy keys until downstream screens are migrated.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `src/main.jsx` | Modified | Route grouping and shared guards |
| `src/App.jsx` | Modified | Session boot/recovery entry |
| `src/CedulaIngreso.jsx` | Modified | Normalize worker/admin login results |
| `src/utils/api.js` | Modified | Central auth-aware transport |
| `src/hooks/` or `src/utils/` | New | Auth state, adapters, route helpers |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Backend auth contract remains undefined | High | Block implementation behind explicit session/claims contract |
| Legacy `localStorage` coupling breaks screens | High | Use compatibility adapter and phased migration |
| Redirect loops or stale access on refresh | Medium | Rehydrate before route decisions and centralize 401 handling |

## Rollback Plan
Revert guard wiring and auth client changes, restore current route mounting, and keep legacy storage reads untouched until contracts are stable.

## Dependencies
- Backend PRD for session issuance, `/auth/me` or equivalent, logout/revocation, refresh policy, and role claims.
- Decision on cookie vs bearer transport across origins.
- Clarification of which routes are private in v1.

## Success Criteria
- [ ] Protected admin/worker routes require a verifiable session instead of `localStorage` flags.
- [ ] Redirected users can complete recovery from `/cedula` and return to the intended route.
- [ ] Proposal/spec phases stay explicit that real offline auth is deferred.
