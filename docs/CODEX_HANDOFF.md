# RASID: implementation-to-deployment handoff

Repository reviewed **2026-09-15**. Backend evidence from **2026-09-11** remains in [VERIFICATION.md](VERIFICATION.md); current frontend evidence is recorded under [`frontend/docs/`](../frontend/docs/). Recheck files and environment when resuming; conversation history is not authoritative.

## Implemented

One repository contains a working NestJS backend at the root and an independent Next.js frontend in `frontend/`. RASID is an Arabic-first financial-clarity portfolio demonstration using synthetic, manual, or already sanitized demo data only.

The frontend implements authentication, Overview, manual accounts, transactions,
CSV imports, budgets, recurring obligation estimates, shared/private categories,
session management, bilingual legal pages, responsive navigation, and Arabic/English
localization. It calls the real `/api/v1` backend through a validated public base URL
and uses TanStack Query with user- and scope-aware keys.

Feature modules live in `src/modules/`:

- `auth`: registration/login, refresh rotation, logout, profile, session listing/revocation, ownership enforcement.
- `accounts`, `transactions`, `categories`: manual account snapshots; transaction CRUD, categorization, filters/search/pagination; shared bilingual and private categories.
- `imports`: bounded CSV preview, row errors, duplicate detection, persisted previews, transactional/idempotent commit.
- `analytics`, `budgets`, `obligations`, `insights`: exact monthly facts/comparisons, category budgets, recurring estimates, deterministic bilingual explanations, and an opt-in evidence-bound monthly AI analyst.

Also implemented: strict configuration/DTO validation, consistent errors, request IDs, structured logs, health/readiness, migrations, synthetic fixtures/seed, Swagger/OpenAPI, Docker/Compose, CI/release workflows, and backup/restore scripts. See [README](../README.md) for setup and [LEARNING_GUIDE.md](LEARNING_GUIDE.md) for walkthroughs/exercises.

## Architecture to preserve

NestJS 11/TypeScript + TypeORM 0.3 + PostgreSQL 17; one modular-monolith API at `/api/v1`. Controllers stay thin; services own business rules and ownership-scoped persistence. Foreign resources return the same 404 as missing resources. Do not recreate these rules in Next.js API routes or a second database.

Hand-authored SQL migrations own physical constraints/indexes; automatic schema synchronization and startup migrations are disabled. Compose runs a separate migration step before the API. Monthly analytics and insight facts use repeatable-read snapshots. No microservices, Redis, queues, object storage, bank integrations, payments, live markets, or required AI dependency. The optional analyst is disabled by default and cannot replace deterministic calculations. Details: [ARCHITECTURE.md](ARCHITECTURE.md), [DECISIONS.md](DECISIONS.md).

## Authentication contract

- Passwords use salted asynchronous scrypt. Access JWTs use HS256 and default to 15 minutes; every protected request also checks the PostgreSQL session, enabling immediate revocation.
- Refresh secrets are opaque, stored only as SHA-256 hashes, and rotated under a row lock. Absolute session expiry defaults to 14 days. Stale-token replay commits revocation before returning 401.
- Browser refresh uses the `rasid_refresh` HttpOnly, SameSite=Strict cookie scoped to `/api/v1/auth`, Secure in production. Refresh/logout require `X-RASID-Client: web`; browser origins must be allowed.
- The implemented client uses credentials for cookie requests, keeps access tokens in memory, serializes refresh across tabs, and clears user-scoped caches on logout. Production needs same-site HTTPS or a same-origin proxy; do not weaken cookie policy to accommodate hosting.

## Data contracts the UI must preserve

- UUID identities; transactions inherit ownership and currency through their account. Shared categories have a null owner; private categories are owner-only.
- Money is PostgreSQL `numeric(18,2)` and JSON decimal strings; calculations use SQL or bigint minor units. Positive transaction amounts plus `INCOME`/`EXPENSE` determine direction. Never sum different currencies or infer totals from one page.
- `postedAt` is a date-only `YYYY-MM-DD`; months are `YYYY-MM`. Do not timezone-shift booking dates. Balance snapshots have a separate timestamp and are not recalculated from transactions.
- Unique keys: transaction `(account_id, fingerprint)`, import `(account_id, content_hash)`, budget `(user_id, category_id, month)` even across currencies. Categories are excluded from fingerprints; distinct references distinguish otherwise identical purchases.
- CSV commits recheck ownership/categories and commit rows/status atomically. Invalid rows require acknowledgment; retry the same preview/commit. A committed import does not resurrect subsequently edited/deleted transactions.
- Budgets cover the exact category, not descendants; remaining can be negative. Obligations are recurring estimates due on days 1–28, not paid/unpaid history or extra spending. PATCH omission preserves values; explicit null is allowed only for documented nullable fields.

Exact payloads, pagination, limits, errors, and screen requirements remain in [FRONTEND_HANDOFF.md](FRONTEND_HANDOFF.md) and [openapi.json](openapi.json).

## Recorded verification and fixes

[VERIFICATION.md](VERIFICATION.md) records the backend baseline. On 2026-09-19,
the backend check passed 54 unit tests and build, the current 22-test
real-PostgreSQL HTTP suite passed, and the frontend check passed 80 tests plus its
optimized build with the required API base URL supplied. The OpenAPI contract was
regenerated for the analyst endpoint. No live OpenAI request was claimed because no
personal API key was supplied. See
[QUALITY_VERIFICATION.md](../frontend/docs/QUALITY_VERIFICATION.md).

Recorded operational checks passed: production Docker build/startup, seeded API smoke checks, backup restored into a separate empty database with matching counts/totals, and database outage/recovery (live 200 / ready 503, then ready 200 without API restart). A 100,000-row temporary query-plan experiment demonstrated an index benefit, not a production capacity guarantee. See [OPERATIONS.md](OPERATIONS.md) and [QUERY_PLAN.md](QUERY_PLAN.md).

Implementation fixes documented and visible in code:

- Disabled broken local Watchman integration so Jest could execute.
- Corrected multipart part counting while retaining one-file/zero-field upload limits.
- Added Express as a direct production dependency after container boot failed; added a CI runtime probe.
- Matched the OpenAPI cookie security-scheme name to auth decorators.

## Limitations and unfinished work

Only SAR/USD/EUR and two-decimal money are supported. Offset pages can shift under concurrent writes. Identical same-day purchases can deduplicate without distinct references. Rate limits are process-local and assume one API instance. No password reset, email verification, MFA, automatic retention, transfer/refund ledger, general chatbot, prediction, or financial-advice feature exists. Demo labels do not sanitize uploaded files; never use real statements.

No public deployment, executed remote CI run, published GHCR image, recorded demo,
production load test, or completed personal ownership exercises is evidenced here.
Workflow files, builds, and runbooks are preparation, not proof of those outcomes.
Rendered browser screenshots at the target widths also remain unverified because
the available browser-control runtime could not initialize.

## Intended next step — external deployment

Use [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) after approved frontend,
backend, PostgreSQL, secrets, and DNS access are available. Deploy the two builds on
same-site HTTPS hosts, run migrations explicitly, opt into only synthetic demo data,
then record real domain, cookie, CORS, health, auth, and responsive smoke evidence.
Do not infer production readiness from the local build alone.
