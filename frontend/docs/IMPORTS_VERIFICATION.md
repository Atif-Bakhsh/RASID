# CSV import verification

Verification date: 2026-09-13 (Asia/Riyadh). Scope: Stage 4 CSV imports only. No
backend source, schema, cookie policy, seed data, account behavior or transaction
editing behavior changed in this stage.

## Automated frontend checks

From `frontend/`, using the documented local API base URL for the production build:

```text
pnpm lint                                                        passed
pnpm typecheck                                                   passed
pnpm test                                                        16 files, 57 tests passed
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1 pnpm build passed; /imports prerendered
```

Ten focused import tests cover:

- a single multipart `file` field with no manually supplied `Content-Type` header,
  including a direct transport assertion that the browser receives `FormData`
  without a pre-set boundary;
- server-provided preview counts, record ordinals, statuses, fields and validation
  errors, including duplicate and invalid rows;
- the 512 KiB limit, 1,000-record explanation, `.csv`/empty/oversized-file errors,
  and an always-visible synthetic-data warning;
- explicit rejected-row acknowledgment before commit and a commit body containing
  only `acknowledgeRejectedRows: true` when required;
- commit counts that differ from preview counts, saved history/details and the
  original result returned by repeated commits;
- lost-response recovery by checking `GET /imports/:id`, returning a found
  `COMMITTED` result or retrying one `PREVIEW` commit against the same ID; and
- honest upload-network and indeterminate-commit states without constructing a new
  upload or import ID.

The UI only performs superficial file selection checks. It never parses CSV rows,
calculates preview counts or runs duplicate detection. Query keys are scoped by the
authenticated user. History uses page/limit metadata from the backend; detail uses
the persisted import ID. A successful commit invalidates transactions, analytics,
budgets and insights as required.

## Actual NestJS/PostgreSQL contract verification

From the repository root:

```text
TEST_DATABASE_URL=postgresql://rasid:rasid-local-demo-only@localhost:55432/postgres pnpm test:e2e
1 suite, 22 HTTP/database tests passed
```

The isolated E2E suite starts the real NestJS application and uses a disposable
PostgreSQL test database. Its import coverage verifies server row validation,
same-byte upload reuse, explicit acknowledgment, concurrent/repeated commit
idempotency, duplicates introduced between preview and commit, rollback/retry,
ownership isolation, size/type/form-field failures and stored history/details.

No import was committed into the persistent seeded demo database because committed
imports are intentionally permanent history and have no delete endpoint. The E2E
database was therefore the safe real-backend integration target.

## Still unverified manually

Rendered browser inspection at mobile, tablet and desktop widths was not completed
in this environment. The implementation has single-column breakpoints, a
keyboard-focusable horizontally scrollable row table, mobile-stacked counts and
LTR treatment for ISO dates, references and amounts, but that is implementation
evidence rather than screenshot proof. Before Stage 4 approval, exercise both
Arabic RTL and English modes in a real browser, including file download, native
file selection and an intentionally interrupted commit response.
