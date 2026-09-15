# RASID

**Arabic-first personal financial clarity, built to make backend engineering inspectable.**

RASID is a Next.js, NestJS, and PostgreSQL portfolio application. A user signs in, creates manual accounts, records or imports synthetic transactions, and sees monthly totals that reconcile to the stored rows. Every financial amount is a decimal string. Arabic category names, errors, and insight explanations are first-class API fields.

This is a demo-data system. It does not connect to banks, accept banking credentials, move money, trade, use live market feeds, or provide financial advice. The Arabic-first demonstration frontend lives in [`frontend/`](frontend/); its contracts remain documented in [FRONTEND_HANDOFF.md](docs/FRONTEND_HANDOFF.md).

## Run the complete backend

Requires Docker with Compose. Local TypeScript development also uses Node 24 LTS and pnpm 11.7.0.

```sh
cp .env.example .env
docker compose up --build -d
docker compose exec api node dist/database/seed-demo.js
```

The opt-in seed reads `DEMO_EMAIL`, `DEMO_PASSWORD`, and `DEMO_MONTH` from `.env`. It never overwrites an existing user. The example credentials are **atif@example.test / Synthetic-Demo-Only-2026!** and the demonstration month is **September 2026**. These are intentionally public, local-demo credentials, not production secrets.

- Interactive API: [localhost:3000/docs](http://localhost:3000/docs)
- OpenAPI JSON: [localhost:3000/openapi.json](http://localhost:3000/openapi.json)
- Service info: [localhost:3000/api/v1](http://localhost:3000/api/v1)
- Liveness: `/api/v1/health/live`; database/schema readiness: `/api/v1/health/ready`

PostgreSQL is bound to `127.0.0.1:55432`. The migration service finishes before the API starts. `docker compose stop` stops the demo while preserving its database volume.

## What is implemented

| Module | Working behavior |
| --- | --- |
| Auth | Register, login, rotating refresh cookie, logout, session list/revoke, immediate revocation of associated access tokens |
| Accounts | Create/list/details/update; typed accounts, supported currencies, dated balance snapshots; nonempty account deletion is rejected |
| Transactions | Create/update/delete, categorization, ownership, exact amounts, duplicate fingerprints, date/category/currency/direction filters, literal search, stable offset pagination |
| CSV imports | Bounded UTF-8 upload, strict headers, row errors, preview persistence, file/account deduplication, explicit partial acceptance, transactional and idempotent commit |
| Categories | Shared Arabic/English defaults and private user categories; one-level hierarchy |
| Analytics | Income, spending, net, category totals, previous-month comparison, separately labeled recurring obligation estimates |
| Budgets | One category/month budget per user, currency-specific spending and computed remaining amount |
| Obligations | Manual recurring monthly estimates, due day 1–28, activation/deactivation |
| Insights | Deterministic versioned rules with bilingual explanations, source facts, and thresholds |
| Operations | Validated configuration, structured logs, request IDs, health/readiness, migrations, Docker, CI/release image workflow, backup/restore tools |

## Architecture

```mermaid
flowchart LR
    Client[API explorer / future Arabic web UI] --> HTTP[Request ID + body limits + origin checks]
    HTTP --> Guards[Rate limit + JWT + active session]
    Guards --> DTO[DTO validation]
    DTO --> Controllers[Thin feature controllers]
    Controllers --> Services[Feature services and ownership predicates]
    Services --> ORM[TypeORM repositories / parameterized SQL]
    ORM --> PG[(PostgreSQL)]
    PG --> Facts[Exact aggregates]
    Facts --> Insights[Deterministic insight rules]
```

One deployment, one relational database, no message broker or caching service. Read the [architecture and tradeoffs](docs/ARCHITECTURE.md) and [decision ledger](docs/DECISIONS.md).

## Work locally

```sh
npm install --global pnpm@11.7.0
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d db
pnpm migration:run
pnpm seed:demo
pnpm start:dev
```

Use this workflow instead of the Compose API when developing; stop an already-running Compose API first to free port 3000. `pnpm migration:run` is explicit: startup never synchronizes tables or silently runs migrations.

In a second terminal, start the frontend:

```sh
cd frontend
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:5173`. The browser origin must be present in backend
`CORS_ORIGINS`.

## Verify

```sh
pnpm check
TEST_DATABASE_URL=postgresql://rasid:rasid-local-demo-only@localhost:55432/postgres pnpm test:e2e
```

`pnpm check` checks formatting, lint, strict types, unit tests, and compilation. The HTTP suite uses the real PostgreSQL engine and the same request pipeline as production. It creates a random `rasid_test_*` database and removes only that database afterward. The local/CI database role therefore needs `CREATEDB`; application production credentials should not have it.

The tests exercise ownership failures, invalid bodies, replayed tokens, decimal reconciliation, upload boundaries, concurrent duplicate requests, and rollback under an injected PostgreSQL failure. See [verification evidence](docs/VERIFICATION.md) for checks actually executed; a workflow file is not evidence of a remote CI run.

## Explore and learn

- [API examples](docs/API_EXAMPLES.md): complete login/account/transaction/import flow.
- [Learning guide](docs/LEARNING_GUIDE.md): request traces, module responsibilities, rejected alternatives, exercises.
- [Frontend handoff](docs/FRONTEND_HANDOFF.md): implemented screens, auth transport, response shapes, states, and acceptance criteria.
- [Deployment checklist](docs/DEPLOYMENT_CHECKLIST.md): production topology, secrets, migrations, domain, cookie, CORS, and smoke checks.
- [Operations runbook](docs/OPERATIONS.md): configuration, deployment, diagnosis, backup and restore.
- [Query-plan note](docs/QUERY_PLAN.md): pagination choice and reproducible index experiment.
- [Demo rehearsal](docs/DEMO_SCRIPT.md): a short engineering walkthrough you can record.
- [Ownership tracker](docs/OWNERSHIP_TRACKER.md): prove you can explain and modify each feature.

## Boundaries and limitations

The API is implemented and reproducible locally. Public hosting, a recorded demo, and a green GitHub CI run require publishing this repository and configuring a hosting target; they are not claimed here.

Only SAR/USD/EUR with two-decimal amounts are supported. Different currencies are never summed together. Balances are manual snapshots, not a reconstructed ledger. Date-only transaction booking dates determine calendar months; timezone is a user preference, not an implicit date conversion. Transfers, refunds linked to original purchases, debt amortization, and historical obligation payment tracking are outside this MVP.

CSV deduplication can consider two identical same-day purchases duplicates unless they have distinct references. A committed import remains committed even if its resulting transactions are later edited or deleted. Refresh rotation intentionally treats simultaneous reuse as suspicious; the frontend must serialize refresh requests across tabs. The process-local rate limiter resets on restart and assumes one API instance.

There is no password reset/email delivery, email verification, MFA, automatic data-retention scheduler, or AI advisor. Demo labels do not automatically sanitize user uploads: only synthetic or already sanitized records belong in this project. Never upload real account statements to a public portfolio demo.
