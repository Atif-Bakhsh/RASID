# Stage 8 — launch preparation

Date: 2026-09-15

## Code-complete

- The existing RASID SVG mark is served as the application favicon.
- Root, public legal, authentication, and authenticated routes have concise
  Arabic/English titles and descriptions. Auth and protected routes emit
  `noindex, nofollow` metadata.
- `/privacy` and `/terms` provide Arabic-first, English-toggleable portfolio-demo
  documents, links from both public auth and authenticated shells, and an explicit
  professional-review warning. They make no banking, certification, regulatory, or
  absolute security claims.
- `robots.txt` allows the public legal and icon resources while disallowing
  authentication and application routes. A sitemap is intentionally deferred until
  the canonical domain is known.
- `NEXT_PUBLIC_API_BASE_URL` validation requires an absolute HTTP(S) URL ending in
  `/api/v1`; production guidance requires HTTPS and a same-site frontend/API
  topology. The optional public demo email/password must be configured together;
  omitting both hides the credential helper from a production build.
- `docs/DEPLOYMENT_CHECKLIST.md` records infrastructure, PostgreSQL, migration,
  HTTPS, cookie, CORS, domain, demo-data, legal, and real-domain smoke-test steps.
- The required synthetic-data notice remains visible. No generator or “Made with
  AI” branding was added.

## External actions still required

- Select and authenticate approved frontend, backend, and PostgreSQL providers.
- Supply production secrets and exact origins through provider secret managers.
- Choose the canonical frontend/API domains, configure DNS, and issue HTTPS
  certificates.
- Run production migrations, optionally seed only synthetic demo data, and record
  provider/migration evidence.
- Verify the refresh cookie, CORS, authentication, responsive layouts, metadata,
  and product flows on the real public domains.
- Obtain professional legal review before use beyond a personal portfolio demo.

## Local verification

- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: 23 files and 74 tests passed after the final-review fixes.
- `NEXT_PUBLIC_API_BASE_URL=https://api.rasid.example/api/v1 pnpm build`:
  production build passed and statically generated all 14 routes.
- The production server returned 200 for `/`, `/login`, `/privacy`, `/terms`,
  `/robots.txt`, and `/icon.svg`. HTML inspection confirmed the bilingual legal
  metadata, RASID favicon, and `noindex, nofollow` on `/login`.
- Static client/server bundle scans found no JWT secret, database URL, private key,
  or PostgreSQL connection string.

Rendered browser inspection remains unverified because the available in-app browser
runtime could not initialize in this environment. Source-level responsive behavior
and interaction tests are recorded in the design and quality reports.

This file records repository preparation only. It is not evidence of a deployment.
