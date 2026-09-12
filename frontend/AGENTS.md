# RASID frontend engineering guide

This directory is the standalone Next.js client for the existing NestJS API at the repository root. It has its own `package.json`, `pnpm-lock.yaml`, and build. Do not move backend files into this directory or add Next.js route handlers that reproduce backend behavior.

## Product boundaries

- RASID is an Arabic-first, synthetic/manual/sanitized-demo-data portfolio project. It is not a bank connection, payment product, trading product, or financial-advice service.
- Arabic (`ar`) and RTL are the default. English (`en`) is a supported review/demo locale. Any new copy must be added to both locales.
- Keep the persistent demo notice visible: `بيانات تجريبية فقط — لا يوجد اتصال بالبنوك` / `Demo data only — no bank connection`.
- Never fabricate successful API responses, connected accounts, market data, recommendations, or authoritative client-side totals.

## Architecture

- Use the App Router and TypeScript in strict mode. Pages and layouts stay in `src/app`.
- Shared visual primitives belong in `src/components`; cross-cutting providers in `src/providers`; product capabilities in `src/features`; transport and framework-independent utilities in `src/lib`; runtime configuration in `src/config`.
- Keep Server Components as the default. Add `"use client"` only at interactive boundaries.
- The NestJS OpenAPI contract in `../docs/openapi.json` and the behavior guide in `../docs/FRONTEND_HANDOFF.md` are the sources of truth.
- Use TanStack Query for server-state caching. Cache keys must eventually include the authenticated user and relevant currency/month/filter scope. Clear user-scoped caches on sign-out.
- Keep money as decimal strings. Never derive authoritative totals with JavaScript `Number`, mix currencies, or timezone-shift `YYYY-MM-DD` booking dates.

## API and authentication

- Read the API base URL from `NEXT_PUBLIC_API_BASE_URL`; do not hard-code a production hostname.
- Keep access tokens in memory only. Never persist them in cookies accessible to JavaScript, `localStorage`, or `sessionStorage`.
- Refresh and logout requests use `credentials: "include"` and `X-RASID-Client: web`.
- A protected 401 may trigger one coordinated refresh and one retry. Never create a retry loop.
- Coordinate rotating refresh tokens across tabs with Web Locks and BroadcastChannel when available. Maintain a clearly documented single-tab fallback.
- Surface the API's localized error message and request ID. Network errors and empty data are different states.
- Do not weaken the backend cookie or CORS policy. Production requires same-site HTTPS hosts or an explicitly designed same-origin proxy.

## Design and accessibility

- Follow the semantic tokens in `src/app/globals.css`; avoid one-off color, spacing, radius, shadow, and typography values in components.
- The visual direction is a restrained Arabic ledger: warm paper backgrounds, deep ink surfaces, one teal accent, precise rules, generous space, and subtle geometric texture.
- IBM Plex Sans Arabic is the body/UI face; Noto Kufi Arabic is reserved for brand and display moments. Keep numeric and code-like values in a readable LTR run.
- Use semantic HTML, visible focus, labeled controls, keyboard-operable interactions, and live regions for asynchronous status.
- Design and check layouts at roughly 360px, 768px, and 1440px. Respect reduced-motion preferences.

## Verification

Run from this directory before claiming frontend success:

```sh
pnpm lint
pnpm typecheck
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1 pnpm build
```

Fix failures instead of suppressing rules. If a behavior changes, add focused tests when the stage includes a test runner and report any checks not run.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
