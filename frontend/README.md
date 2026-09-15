# RASID frontend

Arabic-first Next.js client for the existing RASID NestJS API. This directory is an independent pnpm workspace; the backend remains at the repository root.

## Local setup

```sh
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

The frontend runs on [http://localhost:5173](http://localhost:5173). The example configuration connects to the local API at `http://localhost:3000/api/v1`; that exact frontend origin must be allowed by the backend CORS configuration.

`NEXT_PUBLIC_API_BASE_URL` is required at build time. The optional
`NEXT_PUBLIC_DEMO_EMAIL` and `NEXT_PUBLIC_DEMO_PASSWORD` pair controls the
synthetic demo-account helper on the login screen. Both values are intentionally
browser-visible; omit both from a production build when a shared demo account is
not intended.

## Commands

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

## Source map

- `src/app`: App Router layouts, pages, metadata, and global design tokens. Route groups keep future `(auth)` screens separate from the authenticated `(app)` shell.
- `src/components`: reusable UI and the responsive application shell.
- `src/config`: validated public runtime/build configuration.
- `src/features`: product capability boundaries; authentication, Overview, accounts,
  transactions, CSV imports, budgets, obligations, categories, and sessions.
- `src/lib`: API transport, shared contracts, and localization dictionaries.
- `src/providers`: locale, query-cache, and authentication composition.

## Implemented stage

Stage 1 provides `/login`, `/register`, startup cookie-based session restoration,
protected application routing, coordinated one-retry refresh behavior, and logout.
Access tokens remain in module memory and user-scoped TanStack Query state is
cleared on sign-out.

Stage 2 replaces the authenticated `/` holding screen with the Overview. It uses
the existing protected API client for these three GET requests, each scoped to
the selected `month` and `currency`:

- `/analytics/monthly`: income, spending, net, previous-month comparison, category
  spending, and separate currently-active recurring obligation estimates.
- `/budgets`: exact-category limits and API-calculated spending, remaining and
  utilization (including negative remaining and utilization above 100%).
- `/insights`: bilingual titles/explanations, returned facts/rule version, and the
  API disclaimer.

Query keys are `[resource, userId, month, currency]`, using the resource prefixes
`analytics`, `budgets`, and `insights`. Queries have 30-second freshness, independent
loading/error/retry states, and abort signals. A new scope does not display the old
scope as placeholder data. The shared provider retries network/5xx failures at most
twice and does not retry 4xx responses; protected 401 handling remains in the auth
client. Window-focus refetching is disabled. The refresh button refetches all three
resources, and signing out still clears the entire user cache. No financial
mutations or new auth storage were added.

Money is formatted directly from decimal strings. Arabic/RTL is the default;
the language toggle switches UI and API-provided bilingual copy without refetching.
Dates and numeric values retain LTR runs. The layout uses ledger-style totals and
tables instead of fabricated charts.

Stage 3 adds backend-paginated manual accounts, account details and allowed
mutations, plus the transaction ledger with server pagination, filtering and
ordering. The transaction account dictionary walks every account page at the API's
maximum supported page size; it never assumes page one is complete. Mutation
payloads preserve decimal strings and date-only strings, omit unchanged PATCH
fields, and use explicit `categoryId: null` to clear a category. Transaction
mutations invalidate transactions, analytics, budgets and insights. Account
mutations invalidate account lists/details and the complete account dictionary.

Stage 4 adds `/imports` with backend-paginated history, full saved details, owned
account selection, synthetic CSV downloads, server preview rows/counts and an
explicit invalid-row acknowledgment. The browser sends one `FormData` file and
leaves the multipart boundary unset. Commit results remain separate from preview
counts. If a commit response is lost, the client checks the same import ID and,
only while it remains `PREVIEW`, retries that same commit once. Successful commits
invalidate transaction, analytics, budget and insight queries. No CSV parsing or
duplicate detection is recreated in the browser.

Stage 5 adds `/budgets` for month/currency-scoped budgets and paginated recurring
obligation estimates, plus `/settings` for shared/private categories and session
revocation. Budget usage, spending, remaining values, and utilization come directly
from the API; only the visual bar is capped at 100%. Budget category scope remains
exact, and obligations are never presented as recorded payments. Category and
session controls follow backend ownership and session-ID semantics without inferred
device or location data. Mutations invalidate only their documented dependent query
families, while revoking the current session clears authentication and user cache.

Stage 6 audits the complete interface for visual consistency, keyboard behavior,
RTL/LTR readability, responsive adaptations, and accessible dialog/navigation
behavior. Stage 7 adds focused management contract tests and an actual-API smoke
script while retaining server-authoritative financial values. Stage 8 adds public
`/privacy` and `/terms` routes, bilingual metadata, favicon/crawler decisions, and
production deployment documentation. Authenticated and authentication routes are
explicitly marked `noindex`; a sitemap is intentionally deferred until a canonical
public domain exists.

## Overview verification

From this directory, with the untouched synthetic seeded backend running:

```sh
node scripts/smoke-overview.mjs
```

This checks September reconciliation, food overspend, insight facts/disclaimers,
recurring-estimate semantics, and empty July/SAR and September/USD scopes. It only
reads financial data, creates one demo session, then revokes it in `finally`.
`RASID_API_URL` can override the complete API base URL; `DEMO_EMAIL` and
`DEMO_PASSWORD` can override the documented synthetic credentials.

See [Stage 2 verification](docs/OVERVIEW_VERIFICATION.md) for dated evidence and
the outstanding rendered-browser checks.

## Accounts and transactions verification

With the local seeded backend running:

```sh
pnpm smoke:ledger
```

This creates uniquely named synthetic records, checks account pagination/detail,
allowed account updates, delete conflict behavior, transaction filters/order,
date-only and exact decimal strings, category clearing, omitted-field preservation,
duplicate detection and cleanup. It removes created records in `finally`, logs out,
and confirms the untouched September totals after cleanup.

See [Stage 3 verification](docs/LEDGER_VERIFICATION.md) for dated evidence and the
outstanding rendered-browser checks.

## CSV import verification

The frontend interaction and request-contract tests run with the normal test suite.
The repository's isolated backend E2E suite verifies the corresponding NestJS and
PostgreSQL preview/commit semantics:

```sh
pnpm test
cd ..
TEST_DATABASE_URL=postgresql://rasid:rasid-local-demo-only@localhost:55432/postgres pnpm test:e2e
```

See [Stage 4 verification](docs/IMPORTS_VERIFICATION.md) for the covered success,
failure and timeout-recovery paths and the remaining browser-level checks.

## Management verification

See [Stage 5 verification](docs/MANAGEMENT_VERIFICATION.md) for the implemented
contracts, interaction coverage, and current integration evidence.

With the local seeded backend running, management integration can be checked with:

```sh
pnpm smoke:management
```

See [design audit](docs/DESIGN_AUDIT.md), [quality verification](docs/QUALITY_VERIFICATION.md),
and [launch preparation](docs/LAUNCH_PREPARATION.md) for the later-stage evidence and
remaining external checks.
