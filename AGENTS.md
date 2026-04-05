# AGENTS.md — GRUAMAN-BOMBERMAN-FRONT (Gentle AI)

## 1) Mission
Maintain and improve this **React + Vite PWA** with strong engineering standards, while keeping the codebase ready for a future migration to **Next.js + TypeScript**.

## 2) Verified project snapshot (current state)
- Framework/runtime: **React 19** + **Vite 7** (ESM)
- Language: **JavaScript/JSX** (TypeScript is not implemented yet)
- Routing: **react-router-dom 7**
- Styling: **Tailwind CSS 4**
- PWA: **vite-plugin-pwa** with `injectManifest` and `public/sw.js`
- Data/offline utilities: **Dexie** is available
- Quality gate currently available: `npm run lint`
- Not available yet: test runner (`npm test`), type-check command, formatter command

## 3) Non-negotiable rules
- **Never run build commands automatically** (`npm run build`) unless the user explicitly asks.
- **Always verify assumptions in code/docs before stating facts.**
- If a request is ambiguous and risky, ask **one** concise question and stop.
- Keep changes minimal, reversible, and scoped to the request.
- Never remove existing behavior unless explicitly requested.
- Never add AI attribution or `Co-Authored-By` metadata in commits.

## 4) Architecture and design standards
- Apply **SOLID** principles in all non-trivial changes.
- Use the **Adapter Pattern** to isolate backend/API payloads from UI-facing models.
- Keep UI components focused on rendering; move business logic and transformations to:
  - `src/hooks/`
  - `src/utils/`
- Prefer component-local state. Introduce global state only when truly shared and complex (Zustand if/when adopted).
- Keep props simple and explicit. Inject external dependencies (URLs, service instances, feature flags) through props/parameters.
- For high complexity, prefer creating new focused modules/components over bloating existing files.

## 5) Resilience and defensive programming
- Always guard uncertain data with optional chaining and safe fallbacks.
- Never assume API shape stability; normalize data in adapters before reaching UI components.
- Handle loading, empty, and error states explicitly in user flows.
- For technical errors, use controlled `console.error` only when user-facing feedback is not available.

## 6) Code organization conventions
- `src/components/` → UI and composition
- `src/hooks/` → reusable stateful logic
- `src/utils/` → pure helpers/transforms
- `src/db/` → local persistence/offline storage
- `src/config/` → static configuration
- `src/interfaces/` → domain contracts (create as needed; JSDoc typedefs now, TS interfaces later)

## 7) Language, naming, and documentation
- All **new** code comments and documentation must be in **English**.
- If touching Spanish comments, translate them to English in the same change when feasible.
- Use clear names and predictable folder structure; avoid abbreviations without domain meaning.
- Add concise JSDoc/TSDoc-style docs for complex hooks, utilities, and components.

## 8) PWA-specific guardrails
- Do not break installability/offline behavior:
  - Keep `public/manifest.json`, `public/sw.js`, and PWA config in `vite.config.js` consistent.
- Any change to caching/service worker logic must include:
  - cache invalidation strategy,
  - rollback note,
  - manual verification steps (install, offline load, update flow).

## 9) Quality workflow for this repository
- After code changes, run: `npm run lint`.
- Since no test runner exists yet, do not claim automated test coverage unless it was actually added.
- For changes touching many files or critical flows, provide a short manual QA checklist.
- If a later implementation is required for correctness/security, raise it explicitly (do not hide TODO risks).

## 10) Migration-ready rules (for future Next.js + TypeScript move)
- Keep domain logic framework-agnostic (hooks/utils/adapters first, UI second).
- Avoid scattering router-specific behavior deep in domain modules.
- Guard browser-only APIs (`window`, `document`, notifications, service worker) so SSR migration is straightforward.
- Prefer named exports and explicit module boundaries to ease codemods.
- When adding new domain models, define clear contracts (JSDoc now) that can be converted to TS interfaces/types later.
- Do **not** introduce Next.js-only conventions yet unless explicitly requested.

## 11) Gentle AI operating mode
- For medium/large changes, prefer SDD workflow (`/sdd-new`, `/sdd-continue`, `/sdd-verify`).
- Persist important discoveries/decisions/bugfixes with Engram memory.
- Respect project skill registry at `.atl/skill-registry.md` when triggers match.
