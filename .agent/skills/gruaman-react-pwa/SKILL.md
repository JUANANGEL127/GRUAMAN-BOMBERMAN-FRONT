---
name: gruaman-react-pwa
description: >
  Project-specific frontend skill for React 19 + Vite 7 + Tailwind CSS 4 + PWA work in GRUAMAN-BOMBERMAN-FRONT.
  Trigger: When changing React components, hooks, routes, adapters, offline flows, Dexie usage, Vite/PWA config, or frontend architecture in this repository.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- React/JSX implementation or refactors in `src/components/`
- Business logic extraction into `src/hooks/` or `src/utils/`
- API normalization/adapters before data reaches UI
- PWA/service worker/installability/offline changes
- Vite, routing, Dexie, or migration-readiness decisions

## Critical Patterns

- Keep components render-focused; move transformations and business logic out of JSX.
- Normalize unstable backend payloads before they hit UI components.
- Prefer explicit props and dependency injection over hidden globals.
- Guard browser-only APIs so future SSR/Next.js migration stays viable.
- Do not run build commands unless the user explicitly asks.
- After code changes, use `npm run lint` as the available quality gate.
- If a change touches PWA/offline behavior, document cache invalidation, rollback, and manual verification steps.

## Decision Guide

| Situation | Preferred approach | Avoid |
| --- | --- | --- |
| Reused UI logic | Custom hook in `src/hooks/` | Duplicating logic across components |
| Payload mapping | Adapter/helper in `src/utils/` or dedicated adapter module | Mapping raw API data inline in JSX |
| Shared domain contract | JSDoc typedefs / explicit object shape | Implicit ad-hoc object assumptions |
| Complex component | Split into focused modules/components | Growing a god-component |
| Browser API usage | Guard access and isolate side effects | Direct access deep inside domain logic |

## Code Examples

```js
// Good: adapt before rendering
export function adaptTow(payload = {}) {
  return {
    id: payload.id ?? "",
    operatorName: payload.operator?.name ?? "Unknown",
    status: payload.status ?? "pending",
  };
}
```

```js
// Good: UI stays focused on rendering
export function TowCard({ tow }) {
  return <article>{tow.operatorName}</article>;
}
```

## Commands

```bash
npm run lint
```

## Resources

- **Project rules**: `AGENTS.md`
- **SDD config**: `openspec/config.yaml`
- **Skill registry**: `.atl/skill-registry.md`
