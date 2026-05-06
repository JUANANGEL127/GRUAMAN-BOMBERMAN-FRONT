# protected-route-access Specification

## Purpose

Define verifiable access control and redirect recovery for private worker and admin routes.

## Requirements

### Requirement: Enforce verifiable access to private routes

The system MUST require a valid session before granting access to private routes, including `/bienvenida`, `/game/world-map`, `/game/level/:worldId`, and equivalent private worker or admin screens defined for v1.

#### Scenario: Redirect unauthenticated access attempt

- GIVEN a user without a valid session
- WHEN they navigate directly to a private route
- THEN the system redirects them to the login entrypoint
- AND it preserves the intended destination for post-login recovery

#### Scenario: Allow authenticated access

- GIVEN a user with a valid session
- WHEN they navigate to a private route
- THEN the system grants access to that route
- AND it does not require a second manual login

#### Scenario: Resume intended destination after login

- GIVEN a user was redirected from a private route to login
- WHEN they complete login successfully
- THEN the system returns them to the originally requested private route
- AND it does not strand them on a default screen unless recovery is impossible
