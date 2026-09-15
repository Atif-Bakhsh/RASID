# RASID production deployment checklist

This checklist prepares a public portfolio demo; it is not evidence that deployment
occurred. Record provider names, URLs, image/build identifiers, migration version,
timestamps, and check results only after performing them.

## Approved topology

Use either:

1. same-site HTTPS hosts such as `app.example.com` for Next.js and
   `api.example.com` for NestJS; or
2. one HTTPS origin with a reverse proxy routing `/api/v1` and the auth cookie path
   to NestJS.

Do not place frontend and API on unrelated registrable domains. The backend refresh
cookie is host-only, `HttpOnly`, `SameSite=Strict`, `Secure` in production, and scoped
to `/api/v1/auth`. The frontend must keep `credentials: include` and
`X-RASID-Client: web` on refresh/logout. Do not weaken these controls for a host.

## Infrastructure

- [ ] Select and record the approved Next.js host with Node 24–26 support.
- [ ] Select and record the approved container/Node host for the NestJS image.
- [ ] Provision persistent PostgreSQL 17-compatible storage and backups.
- [ ] Keep the database private where possible; require verified TLS when remote.
- [ ] Create separate migration/admin and runtime database roles. The runtime role
      must not have `CREATEDB` or schema-creation privileges.
- [ ] Configure provider secret managers; do not copy production secrets into files
      committed to this repository.
- [ ] Select an immutable backend image tag/digest and a frontend build identifier.

## Frontend configuration

Set at build time:

| Variable                    | Production value                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`  | Required absolute HTTPS API base ending exactly in `/api/v1`; no credentials or query |
| `NEXT_PUBLIC_DEMO_EMAIL`    | Optional intentionally public synthetic demo email; set only with the password        |
| `NEXT_PUBLIC_DEMO_PASSWORD` | Optional intentionally public synthetic demo password; set only with the email        |

- [ ] Confirm the public value is same-site with the frontend origin.
- [ ] Rebuild after changing it; `NEXT_PUBLIC_*` is browser-visible and build-bound.
- [ ] Inspect emitted client assets: only intended `NEXT_PUBLIC_*` values may be
      exposed. No JWT secret, database credential, private host, or authentication
      token belongs in the bundle. Shared demo credentials are public by design.
- [ ] On the selected Node host, install and run the frontend from `frontend/` with
      `pnpm install --frozen-lockfile`, `pnpm build`, and `pnpm start`. Record the
      provider-specific build/start configuration rather than committing it for an
      unselected platform.

## Backend configuration

| Variable                   | Production requirement                                                           |
| -------------------------- | -------------------------------------------------------------------------------- |
| `NODE_ENV`                 | `production`                                                                     |
| `PORT`                     | Provider-assigned/listening port, 1–65535                                        |
| `DATABASE_URL`             | PostgreSQL URL with database name; secret-manager value                          |
| `DATABASE_SSL`             | `true` for providers requiring TLS; certificate verification must remain enabled |
| `JWT_SECRET`               | Random secret of at least 32 characters; never an example/development value      |
| `ACCESS_TOKEN_TTL_SECONDS` | 60–3600; documented default 900                                                  |
| `REFRESH_TOKEN_TTL_DAYS`   | 1–30; documented default 14                                                      |
| `CORS_ORIGINS`             | Exact comma-separated HTTPS frontend origins only                                |
| `COOKIE_SECURE`            | `true` (startup rejects `false` in production)                                   |
| `TRUST_PROXY_HOPS`         | Exact known proxy count, 0–3; never blanket trust                                |
| `LOG_LEVEL`                | `log`, `warn`, or `error`                                                        |

Optional public-demo seed variables are `DEMO_EMAIL`, `DEMO_PASSWORD`, and
`DEMO_MONTH`. In production, seeding additionally requires the explicit one-time
`ALLOW_DEMO_SEED=true`. Use a unique `@example.test` address and synthetic password;
remove the opt-in after seeding. Migrations never create demo credentials.

## Migrations and database

- [ ] Back up or snapshot the target before schema change where applicable.
- [ ] Run `node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js`
      once with the chosen image and migration credentials.
- [ ] Record the applied migration name and command result.
- [ ] Start the API with the lower-privilege runtime role.
- [ ] Verify `/api/v1/health/live` returns 200.
- [ ] Verify `/api/v1/health/ready` returns 200 and expected migration state.
- [ ] Confirm database reconnect behavior and backup schedule with the host.

## Web security and domain

- [ ] Configure frontend and API custom-domain DNS records.
- [ ] Wait for authoritative DNS resolution and record the answers.
- [ ] Verify valid HTTPS certificates, complete chains, and no mixed content.
- [ ] Set `CORS_ORIGINS` to the exact production frontend origin(s), with no wildcard.
- [ ] Confirm unintended origins receive 403 on mutation/cookie flows.
- [ ] Confirm API proxy forwarding matches `TRUST_PROXY_HOPS`.
- [ ] Inspect `rasid_refresh`: host-only, HttpOnly, Secure, SameSite=Strict, path
      `/api/v1/auth`; its secret must never appear in JavaScript responses.
- [ ] Confirm access and refresh tokens are absent from localStorage/sessionStorage.

## Demo-data controls

- [ ] Decide whether a shared seeded demo account is appropriate for the approved
      host. If not, omit both public demo variables so the helper is not rendered.
- [ ] If used, seed once with a unique synthetic account and verify existing users
      are not overwritten.
- [ ] Keep the persistent “demo data only — no bank connection” notice visible.
- [ ] Confirm all bundled CSV examples are synthetic.
- [ ] Publish a reset/reseed procedure and retention decision for public submissions.
- [ ] Never load real statements or personal financial data for demonstration.

## Frontend and public routes

- [ ] Build with the production API base and start the generated Next.js application.
- [ ] Verify `/`, `/login`, `/register`, `/accounts`, `/transactions`, `/imports`,
      `/budgets`, and `/settings` route correctly.
- [ ] Verify `/privacy`, `/terms`, `/robots.txt`, and `/icon.svg` return 200.
- [ ] Inspect Arabic-first title/description/Open Graph/Twitter metadata.
- [ ] Confirm authenticated and auth routes emit `noindex, nofollow` metadata.
- [ ] Keep protected routes out of any sitemap. No sitemap is generated until the
      canonical production domain is chosen; add only public/legal URLs then.

## Authentication smoke test on the real domain

- [ ] Register a synthetic test user if public registration is intentionally enabled.
- [ ] Log in and confirm the HttpOnly refresh cookie attributes in browser tools.
- [ ] Load a protected route and confirm Bearer access succeeds.
- [ ] Reload to verify startup refresh/session restoration.
- [ ] Let or force an access token to expire; confirm one refresh and one retry.
- [ ] List sessions, revoke another session, and verify it receives 401.
- [ ] Revoke the current session and confirm return to login.
- [ ] Log out and confirm protected access fails and browser query state is cleared.
- [ ] Confirm no token appears in localStorage, sessionStorage, page HTML, or logs.

## Product smoke test on the real domain

- [ ] Site loads in Arabic RTL; switch to English LTR and back.
- [ ] Check approximately 360px, 768px, and 1440px without horizontal page overflow.
- [ ] Retrieve transactions and exercise pagination/filter reset.
- [ ] Reconcile the approved synthetic month through transactions and Overview.
- [ ] Confirm currencies remain separate and obligations remain estimates.
- [ ] Confirm budget spent/remaining/utilization match API values, including an
      overspend with negative remaining and utilization above 100%.
- [ ] Preview valid, invalid, and duplicate synthetic CSV rows; acknowledge invalid
      rows; commit and repeat the same commit ID.
- [ ] Verify category conflict and session-revocation UI.
- [ ] Verify 401, 404, 409, 413, 422, 429, and a safe network/server failure where
      practical without disrupting other users.
- [ ] Confirm Privacy, Terms, favicon, metadata, and demo notice.

## Operations and evidence

- [ ] Verify API logs contain request metadata but no bodies, authorization headers,
      cookies, query strings, or CSV bytes.
- [ ] Check readiness and production logs again after smoke testing.
- [ ] Record the frontend URL, API URL, custom domain, DNS result, certificate,
      CORS origins, cookie inspection, migration, health checks, smoke account, and
      any failures in `docs/VERIFICATION.md`.
- [ ] Obtain professional legal review of Privacy Policy and Terms before use beyond
      a personal portfolio demo.
