# RASID verification evidence

Executed locally on **2026-09-11**. The database was PostgreSQL 17 in Docker; the production image used Node 24. Host development checks ran on Node 26. All records were synthetic.

## Checks actually performed

| Check | Result |
| --- | --- |
| `pnpm check` | Passed formatting, lint, strict TypeScript, 36 unit tests, and Nest build |
| `pnpm test:e2e` with local TEST_DATABASE_URL | 22 HTTP/database tests passed against a newly created, isolated PostgreSQL database |
| Initial migration | Applied successfully to the demo database |
| Migration revert/reapply | Passed in the isolated HTTP test database; shared categories reseeded correctly |
| Production Docker build | Passed with a separate production-dependency installation |
| Compose startup | Migration service completed, API and database started |
| `pnpm smoke:demo` | Passed live readiness, Swagger, OpenAPI schemas, login cookie, request ID, exact demo totals, budget remaining, and rejected browser origin |
| Synthetic seed | 1 user, 3 accounts, 14 transactions; existing seed email is not overwritten |
| Backup | Custom-format archive created and archive catalog validated |
| Restore | Restored into a separate empty `rasid_restore_*` database; migration, counts and sums matched |
| Database failure/recovery | Database stopped: live 200 / ready 503. Database restarted: live 200 / ready 200, without restarting the API |
| Query-plan experiment | 100,000 temporary synthetic rows; sequential scan + sort replaced by a matching ordered index scan |
| API export | Generated `docs/openapi.json` from the application configuration |
| Patch checks | No whitespace errors or unfinished application scaffold markers |

The test suite verifies cross-user account/transaction/category/budget/session access, unknown body fields, bad UUIDs and dates, null/omitted PATCH semantics, exact decimal reconciliation, currency/month separation, duplicate creates, import retries and overlaps, injected database rollback, refresh replay/concurrency/expiry, logout/revocation, database constraints, and auth rate limiting.

## Reconciliation after restore

The restore used a separate database named `rasid_restore_proof_20260911_8u6dr1`, not the source database. Verification queries returned:

```text
migration: InitialSchema1788998400000
users: 1
accounts: 3
transactions: 14
September 2026 SAR income:   12300.00
September 2026 SAR spending:  4653.00
September 2026 SAR net:       7647.00
```

The source's September food budget also reported remaining `-48.00`. Twelve September transactions in the current account plus one in the cash account reconcile to the monthly report; the remaining transaction belongs to August.

## Failures found and corrected during implementation

- The local Watchman executable had a missing system library. Jest is configured with Watchman disabled; both suites then executed normally.
- The multipart parser's part limit counted the closing boundary, initially rejecting valid uploads. The boundary limit was corrected while retaining one-file/zero-field restrictions, and upload HTTP tests passed.
- Express was available during local development but not explicitly installed in the production dependency set. It is now a direct dependency; the container boots successfully. CI includes a runtime startup probe in addition to its image build.
- The OpenAPI cookie scheme needed the same explicit name as the cookie-auth decorators. The scheme and exported contract now agree.

## Evidence still requiring a published environment or personal work

No claim is made of a public deployment, an executed GitHub Actions run, a published GHCR image, a recorded video, a production load test, or completed personal ownership exercises. The repository includes their runnable configuration, runbooks, handoff and rehearsal material. Add real URLs/results after those actions occur.

The frontend is intentionally deferred to the next prompt; its complete implementation contract is [FRONTEND_HANDOFF.md](FRONTEND_HANDOFF.md). The backend can already be demonstrated through `/docs` and the API examples.
