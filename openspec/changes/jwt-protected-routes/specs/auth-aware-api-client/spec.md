# auth-aware-api-client Specification

## Purpose

Define consistent authentication behavior for backend calls used by protected frontend flows.

## Requirements

### Requirement: Coordinate authenticated requests and unauthorized responses

The system MUST use cookie-based auth for protected backend requests, normalize `GET /auth/session`/refresh/logout outcomes into the shared session contract, and react consistently to unauthorized responses.

#### Scenario: Use active session for protected API calls

- GIVEN a valid session exists
- WHEN a protected backend request is sent
- THEN the request MUST be sent with `withCredentials: true`
- AND the request MUST rely on HttpOnly cookies (`gm_access`, `gm_refresh`) instead of JS-managed bearer tokens
- AND the response is interpreted against the shared session model

#### Scenario: Attach CSRF header on unsafe requests when available

- GIVEN a request method is unsafe (`POST`, `PUT`, `PATCH`, or `DELETE`)
- AND the backend exposes a readable `gm_csrf` cookie for the browser flow
- WHEN a protected backend request is sent
- THEN the client MUST attach the configured CSRF header using the `gm_csrf` cookie value
- AND safe/idempotent requests MUST NOT fail solely because the CSRF header is absent

#### Scenario: Invalidate session on backend 401

- GIVEN a user has an active session
- WHEN any protected backend request returns `401 Unauthorized`
- THEN the client MUST coordinate cookie-based session recovery through `POST /auth/refresh` when the flow allows it
- AND if refresh cannot restore the session, the system invalidates the current session
- AND protected navigation requires the user to log in again

#### Scenario: Deny access cleanly on backend 403

- GIVEN a user has an active session
- WHEN a protected backend request returns `403 Forbidden`
- THEN the system denies the requested action without granting access
- AND the current session remains unchanged unless later invalidated

#### Scenario: End session through backend logout

- GIVEN a user chooses to sign out or the client must terminate the session after auth recovery fails
- WHEN the client ends the session
- THEN it MUST call `POST /auth/logout` with `withCredentials: true`
- AND it MUST clear local auth metadata regardless of whether the logout response succeeds

#### Scenario: Support local same-origin proxy during development

- GIVEN local browser debugging is blocked by cross-origin cookie or preflight behavior
- WHEN the application is configured with a relative API base such as `/api`
- THEN protected requests MUST still resolve through the shared auth-aware client
- AND the dev server MAY proxy those requests to the backend target without changing production auth semantics
