# jwt-session-management Specification

## Purpose

Define the frontend session contract for verifiable access, page reload recovery, and invalidation without requiring real offline auth support.

## Requirements

### Requirement: Rehydrate and validate session state

The system MUST resolve the current session through `GET /auth/session` before protected-route decisions, restore only server-validated session state across page reloads, and treat expired, malformed, revoked, or legacy-only auth data as signed-out state.

#### Scenario: Restore a valid session after reload

- GIVEN persisted session metadata exists locally
- WHEN the application boots or reloads
- THEN the application rehydrates by calling `GET /auth/session`
- AND the user session is restored only if the backend confirms an authenticated cookie-based session
- AND the user may continue to the requested private route

#### Scenario: Reject invalid or expired session data

- GIVEN persisted session metadata is expired, malformed, revoked, or cannot be verified by `GET /auth/session`
- WHEN the application boots or rehydrates session state
- THEN the system clears the session state
- AND the user is treated as signed out

#### Scenario: Treat local persistence as UI metadata only

- GIVEN `auth.session.v1` or legacy profile keys exist in browser storage
- WHEN the backend session cookies are missing, expired, or rejected by `GET /auth/session`
- THEN the system MUST NOT treat local storage data as proof of authentication
- AND the stored data MAY be used only for non-auth UI continuity until the user logs in again

#### Scenario: Preserve migration compatibility without trusting legacy flags

- GIVEN legacy storage keys remain present for downstream screens during migration
- WHEN no valid session exists
- THEN those keys MUST NOT be accepted as proof of authentication
- AND dependent screens MAY still receive non-auth context only after a valid login
