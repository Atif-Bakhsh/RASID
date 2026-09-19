# RASID operations runbook

This runbook operates a single NestJS API and PostgreSQL. Local Compose and the demo seed are for synthetic data. No public deployment has been claimed by generating these files.

## Configuration

Copy `.env.example` to `.env`. Startup validates configuration before listening.

| Variable                                    | Meaning                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `NODE_ENV`                                  | development, test or production                                                                              |
| `PORT`                                      | API port, 3000 default                                                                                       |
| `DATABASE_URL`                              | PostgreSQL connection URL including database name                                                            |
| `DATABASE_SSL`                              | true uses certificate-verified TLS; false is suitable for the local Compose network                          |
| `JWT_SECRET`                                | At least 32 characters; use random bytes for deployment                                                      |
| `ACCESS_TOKEN_TTL_SECONDS`                  | 60–3600; default 900                                                                                         |
| `REFRESH_TOKEN_TTL_DAYS`                    | Absolute session lifetime, 1–30; default 14                                                                  |
| `CORS_ORIGINS`                              | Exact comma-separated origins; HTTPS only in production; include Swagger's origin if it will issue mutations |
| `COOKIE_SECURE`                             | Required true in production                                                                                  |
| `TRUST_PROXY_HOPS`                          | 0 by default; set the exact trusted proxy count, never indiscriminately trust arbitrary forwarding headers   |
| `LOG_LEVEL`                                 | log, warn or error                                                                                           |
| `AI_ENABLED`                                | Optional analyst feature flag; false by default                                                              |
| `OPENAI_API_KEY`                            | Required only when `AI_ENABLED=true`; secret-manager value, never browser-visible                            |
| `OPENAI_MODEL`                              | Allow-listed `gpt-5.6-luna` default or `gpt-5.6-terra`                                                       |
| `AI_TIMEOUT_MS`                             | Provider timeout, 1,000–30,000 ms; default 10,000                                                            |
| `POSTGRES_*`                                | Compose database name, local port and credentials                                                            |
| `DEMO_EMAIL`, `DEMO_PASSWORD`, `DEMO_MONTH` | Explicit opt-in synthetic seed configuration                                                                 |
| `ALLOW_DEMO_SEED`                           | Must be true to intentionally seed a production-mode demo                                                    |

Generate a deployment secret with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Store it in the hosting secret manager. Use a URL-safe or correctly percent-encoded database password; Compose interpolates credentials into its internal URL. Never commit real secrets or dump files.

Do not use the Compose superuser credentials as a public production runtime role. Use a separate migration/administration role and grant the runtime role only the table and sequence privileges it needs. The runtime needs SELECT/INSERT/UPDATE/DELETE on application tables and SELECT on the migration table; it does not need schema creation or CREATEDB. CI's random-database tests intentionally use a separate role with CREATEDB.

If the database provider requires a private certificate authority, install its CA trust correctly (for example via a mounted CA and `NODE_EXTRA_CA_CERTS`). Do not disable certificate verification to conceal a TLS failure.

## Deploy an image

The repository supplies a multi-stage Dockerfile. It builds TypeScript in one stage, installs production dependencies in another, and runs as the unprivileged `node` user. Compose runs it with a read-only filesystem, a temporary `/tmp`, dropped capabilities, and an init process.

CI runs format, lint, strict type checks, unit tests, real PostgreSQL HTTP tests, an image build, and a production-dependency startup probe. The manual release workflow reruns the code checks and publishes a commit-SHA-tagged image to GHCR. A pipeline configuration is not an executed green pipeline; record the actual run link after publishing the repository.

For a VM or container host:

1. Provision PostgreSQL and persistent backups, then configure secrets and exact HTTPS origins. The frontend and API must be same-site for the Strict refresh cookie.
2. Pull the chosen immutable image tag/digest. Run `node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js` once using migration credentials and that image.
3. Start `node dist/main.js` with runtime credentials, port 3000, and a correctly configured HTTPS reverse proxy. Keep the database off the public internet where possible.
4. Check `/api/v1/health/live`, `/api/v1/health/ready`, `/openapi.json`, and a synthetic login/account flow through the actual public HTTPS endpoint.
5. If this is deliberately a public synthetic demo, opt into seeding with unique demo credentials. Do not carry local example JWT/database secrets into deployment.
6. Record the public API/docs URL, image digest, migration version, health check, CI run and demo recording in `VERIFICATION.md`.

The synchronous app is intended for one instance. Scrypt is memory-hard and multiple concurrent password requests allocate native memory; start with at least 1 GiB for the API and measure memory/latency before downsizing. Process-local throttling is not distributed throttling. Scaling to multiple replicas needs an explicit rate-limit/session-abuse plan, not an unexplained Redis addition.

## Observe a request

```sh
docker compose ps
docker compose logs --tail=100 api
curl -i -H 'X-Request-ID: rasid-investigation-01' http://localhost:3000/api/v1/health/ready
```

HTTP logs are JSON with event, requestId, method, route template, status and durationMs. Bodies, Authorization headers, cookies, query strings and uploaded CSV bytes are not logged. A frontend error includes the same request ID so you can correlate it without exposing credentials. Unmatched routes are logged as `unmatched`, not arbitrary attacker-controlled URL text.

AI completion logs contain only model, prompt version, status, evidence count, token counts and duration. They do not contain the question, prompt facts, answer, user ID, or API key. Treat repeated `ai_insight_failed` events as an optional-feature incident: verify the feature flag, secret, egress, provider status and timeout while confirming the normal Overview still works. Do not add automatic retries; a user can explicitly request another explanation.

Liveness means the process can answer HTTP. Readiness requires a database query and the expected migration record. A failed readiness check does not necessarily mean the process died.

| Evidence                            | Next check                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| Connection refused on API port      | `docker compose ps`, then API startup logs                                                         |
| Container exits with missing module | Check production dependencies; build success alone does not prove runtime boot                     |
| Live is 200; ready is 503           | Database health/network, credentials, migration status                                             |
| Ready is 503 after a fresh database | Run the migration service; do not enable synchronize                                               |
| 401 with a previously valid JWT     | JWT expiry, session revokedAt/expiresAt, refresh replay                                            |
| 403 from browser only               | Exact Origin, credentials mode, X-RASID-Client, proxy/HTTPS configuration                          |
| 404 for one user only               | Ownership predicate before assuming the resource is missing globally                               |
| 409 while importing                 | Distinguish transaction duplicate, category change and other constraint conflicts using error.code |
| 429                                 | Back off; inspect auth/CSV request rate and trusted-proxy settings                                 |

## Backup and restore

The helper scripts require compatible PostgreSQL command-line clients. Use a pg_dump client of the same major version as the server or newer, and restore into a compatible PostgreSQL version. For production, implement encrypted storage and access controls for backups outside this repository.

Create a backup file at a **new** path:

```sh
DATABASE_URL=postgresql://rasid:rasid-local-demo-only@localhost:55432/rasid \
  sh scripts/backup.sh /tmp/rasid-synthetic-demo.dump
```

The helper refuses to overwrite an existing file, writes with restrictive permissions, and verifies that pg_restore can read the archive catalog. It does not prove the rows can actually be restored.

Create a separate empty restore database, then restore:

```sh
psql postgresql://rasid:rasid-local-demo-only@localhost:55432/postgres \
  -v ON_ERROR_STOP=1 -c 'CREATE DATABASE rasid_restore_demo'

RESTORE_DATABASE_URL=postgresql://rasid:rasid-local-demo-only@localhost:55432/rasid_restore_demo \
  sh scripts/restore.sh /tmp/rasid-synthetic-demo.dump
```

The restore helper requires a `rasid_restore_*` database and refuses a nonempty target. It restores with `--single-transaction --exit-on-error`. It never overwrites the source database. Verify record counts, migration records, category names, and income/spending sums before changing any application connection string.

```sql
SELECT name FROM migrations;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM accounts;
SELECT COUNT(*) FROM transactions;
SELECT a.currency, t.direction, SUM(t.amount)
FROM transactions t JOIN accounts a ON a.id = t.account_id
WHERE t.posted_at >= '2026-09-01' AND t.posted_at < '2026-10-01'
GROUP BY a.currency, t.direction ORDER BY a.currency, t.direction;
```

For the untouched seed: one user, three accounts, 14 transactions; September SAR income 12,300.00 and expenses 4,653.00. Run a second API instance against the restore database on another port and verify readiness/login if practicing an actual cutover.

## Safe failure and recovery rehearsal

Use a disposable local/CI instance. Capture healthy probes, stop only its database service, and observe that live stays available while ready becomes 503. Restore the database service and verify ready returns 200. The API pool should reconnect without altering financial rows. Preserve request IDs and timestamps as evidence. Do not stop a shared/public demo to rehearse.

For application rollback, redeploy a previously verified compatible image. Database rollback is a separate decision: a migration's down method can remove data. Prefer a forward corrective migration or a verified restore into a separate database. Never run `docker compose down -v` as a routine troubleshooting step; it deletes the database volume.

Expired/revoked sessions and old previews currently have no automatic cleanup job. Review retention manually for the demo. If measured data growth requires scheduled cleanup, add that requirement with retention policy, tests and operational visibility first.
