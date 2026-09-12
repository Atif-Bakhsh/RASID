# RASID: backend-to-frontend handoff

Repository reviewed **2026-09-12**. Execution evidence below is recorded on **2026-09-11** in [VERIFICATION.md](VERIFICATION.md), not a fresh runtime certification. Recheck files and environment when resuming; conversation history is not authoritative.

## Implemented

One repository contains a working NestJS backend at the root. No frontend is implemented. RASID is an Arabic-first financial-clarity portfolio demonstration using synthetic, manual, or already sanitized demo data only.

Feature modules live in `src/modules/`:

- `auth`: registration/login, refresh rotation, logout, profile, session listing/revocation, ownership enforcement.
- `accounts`, `transactions`, `categories`: manual account snapshots; transaction CRUD, categorization, filters/search/pagination; shared bilingual and private categories.
- `imports`: bounded CSV preview, row errors, duplicate detection, persisted previews, transactional/idempotent commit.
- `analytics`, `budgets`, `obligations`, `insights`: exact monthly facts/comparisons, category budgets, recurring estimates, deterministic bilingual explanations.

Also implemented: strict configuration/DTO validation, consistent errors, request IDs, structured logs, health/readiness, migrations, synthetic fixtures/seed, Swagger/OpenAPI, Docker/Compose, CI/release workflows, and backup/restore scripts. See [README](../README.md) for setup and [LEARNING_GUIDE.md](LEARNING_GUIDE.md) for walkthroughs/exercises.

## Architecture to preserve

NestJS 11/TypeScript + TypeORM 0.3 + PostgreSQL 17; one modular-monolith API at `/api/v1`. Controllers stay thin; services own business rules and ownership-scoped persistence. Foreign resources return the same 404 as missing resources. Do not recreate these rules in Next.js API routes or a second database.

Hand-authored SQL migrations own physical constraints/indexes; automatic schema synchronization and startup migrations are disabled. Compose runs a separate migration step before the API. Monthly analytics and insight facts use repeatable-read snapshots. No microservices, Redis, queues, object storage, bank integrations, payments, live markets, or AI dependency. Details: [ARCHITECTURE.md](ARCHITECTURE.md), [DECISIONS.md](DECISIONS.md).

## Authentication contract

- Passwords use salted asynchronous scrypt. Access JWTs use HS256 and default to 15 minutes; every protected request also checks the PostgreSQL session, enabling immediate revocation.
- Refresh secrets are opaque, stored only as SHA-256 hashes, and rotated under a row lock. Absolute session expiry defaults to 14 days. Stale-token replay commits revocation before returning 401.
- Browser refresh uses the `rasid_refresh` HttpOnly, SameSite=Strict cookie scoped to `/api/v1/auth`, Secure in production. Refresh/logout require `X-RASID-Client: web`; browser origins must be allowed.
- The future client must use credentials for cookie requests, keep access tokens in memory, serialize refresh across tabs, and clear user-scoped caches on logout. Production needs same-site HTTPS or a same-origin proxy; do not weaken cookie policy to accommodate hosting.

## Data contracts the UI must preserve

- UUID identities; transactions inherit ownership and currency through their account. Shared categories have a null owner; private categories are owner-only.
- Money is PostgreSQL `numeric(18,2)` and JSON decimal strings; calculations use SQL or bigint minor units. Positive transaction amounts plus `INCOME`/`EXPENSE` determine direction. Never sum different currencies or infer totals from one page.
- `postedAt` is a date-only `YYYY-MM-DD`; months are `YYYY-MM`. Do not timezone-shift booking dates. Balance snapshots have a separate timestamp and are not recalculated from transactions.
- Unique keys: transaction `(account_id, fingerprint)`, import `(account_id, content_hash)`, budget `(user_id, category_id, month)` even across currencies. Categories are excluded from fingerprints; distinct references distinguish otherwise identical purchases.
- CSV commits recheck ownership/categories and commit rows/status atomically. Invalid rows require acknowledgment; retry the same preview/commit. A committed import does not resurrect subsequently edited/deleted transactions.
- Budgets cover the exact category, not descendants; remaining can be negative. Obligations are recurring estimates due on days 1–28, not paid/unpaid history or extra spending. PATCH omission preserves values; explicit null is allowed only for documented nullable fields.

Exact payloads, pagination, limits, errors, and screen requirements remain in [FRONTEND_HANDOFF.md](FRONTEND_HANDOFF.md) and [openapi.json](openapi.json).

## Recorded verification and fixes

[VERIFICATION.md](VERIFICATION.md) records 36 unit tests plus 22 real-PostgreSQL HTTP tests passing, alongside formatting, lint, strict types, and build. Coverage includes ownership, invalid inputs, decimal reconciliation, refresh replay/concurrency, duplicate imports, rollback, and migration revert/reapply.

Recorded operational checks passed: production Docker build/startup, seeded API smoke checks, backup restored into a separate empty database with matching counts/totals, and database outage/recovery (live 200 / ready 503, then ready 200 without API restart). A 100,000-row temporary query-plan experiment demonstrated an index benefit, not a production capacity guarantee. See [OPERATIONS.md](OPERATIONS.md) and [QUERY_PLAN.md](QUERY_PLAN.md).

Implementation fixes documented and visible in code:

- Disabled broken local Watchman integration so Jest could execute.
- Corrected multipart part counting while retaining one-file/zero-field upload limits.
- Added Express as a direct production dependency after container boot failed; added a CI runtime probe.
- Matched the OpenAPI cookie security-scheme name to auth decorators.

## Limitations and unfinished work

Only SAR/USD/EUR and two-decimal money are supported. Offset pages can shift under concurrent writes. Identical same-day purchases can deduplicate without distinct references. Rate limits are process-local and assume one API instance. No password reset, email verification, MFA, automatic retention, transfer/refund ledger, or AI advisor exists. Demo labels do not sanitize uploaded files; never use real statements.

The frontend is not built. No public deployment, executed remote CI run, published GHCR image, recorded demo, production load test, or completed personal ownership exercises is evidenced here. Workflow files/runbooks are preparation, not proof of those outcomes.

## Intended next step — not started in this handoff

Build the responsive Arabic-first **Next.js frontend inside `frontend/`**, retaining the root NestJS backend and separate frontend dependencies/build. Next.js is now the user's selected stack; the older frontend handoff intentionally left that choice open.

Read [FRONTEND_HANDOFF.md](FRONTEND_HANDOFF.md) and [openapi.json](openapi.json) as the sources of truth for frontend behavior/contracts. Keep API port 3000; the documented frontend origin is `http://localhost:5173`. Configure Next.js accordingly or explicitly align any alternative origin with backend CORS. Preserve RTL, demo labeling, actual server facts, and honest failure states. Use [API_EXAMPLES.md](API_EXAMPLES.md) to explore the backend before coding.
