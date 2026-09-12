# Learn to own RASID

You asked for a complete backend and an explanation of how it was built. The implementation is now available to inspect, run, break safely, and change. Reading this guide is a starting point; understanding is demonstrated by making a small change and predicting its consequences.

## Start with the working vertical slice

Run the README setup. Use [API_EXAMPLES.md](API_EXAMPLES.md) to log in, create an account, add a 42.50 expense, and retrieve monthly analytics. Keep the request and response visible beside the code. Do not start by memorizing all decorators.

The first trace to explain aloud is `POST /api/v1/transactions`:

1. `main.ts` boots Nest. `setup-app.ts` configures the prefix, request ID, body limits, security headers, origins, cookies and validation.
2. `auth.guard.ts` validates the bearer JWT and its active database session. The token identifies a user; it does not authorize access to every account.
3. `CreateTransactionDto` checks the request's shape. An amount must be a decimal string. An account must be a UUID. A date must really exist. Extra fields are rejected.
4. `transactions.controller.ts` obtains the trusted user ID and passes the DTO to `TransactionsService`.
5. `TransactionsService.create()` opens a database transaction, checks account ownership, checks category visibility, validates a positive amount, calculates a fingerprint, and saves the row through the transaction's manager.
6. PostgreSQL enforces foreign keys, amount checks and the per-account uniqueness constraint. Two simultaneous identical requests cannot both insert a row.
7. The saved row returns through the controller. Unexpected database details are concealed by the error filter; a duplicate becomes a documented conflict.

Now answer without looking: **Why is a valid UUID insufficient?** Because it proves syntax, not ownership. **Why check uniqueness in PostgreSQL when the service can look first?** Because two requests can both observe “not found” before either writes. The constraint settles the race.

## Why the files are arranged this way

| Files                                                                 | Job                                             | What to explain                                          |
| --------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `src/main.ts`, `src/setup-app.ts`                                     | Process and shared HTTP pipeline                | Why tests and production share setup                     |
| `src/app.module.ts`                                                   | Composition and dependency injection            | Which module supplies each service/repository            |
| `src/app.controller.ts`                                               | Service info, liveness, readiness               | Alive vs able to serve database-backed work              |
| `src/config/environment*`                                             | Typed startup configuration and tests           | Why malformed config fails before serving requests       |
| `src/common/errors.ts`, `http.ts`                                     | Stable errors, request IDs, safe logs           | How one request is correlated without logging tokens     |
| `src/common/money*`, `query.dto.ts`, `validation.ts`                  | Shared amount/date/query contracts              | Decimal strings, bigint cents, date-only months          |
| `src/common/openapi-responses.ts`                                     | Response schemas                                | Why request DTOs alone do not document aggregate outputs |
| `src/database/data-source.ts`, `base.entity.ts`                       | TypeORM setup and common record identity        | Why synchronize is disabled                              |
| `src/database/migrations/*`                                           | Physical tables, checks, keys and indexes       | What is enforced even without Nest                       |
| `src/database/seed-demo.ts`                                           | Explicit synthetic scenario                     | Why seeds are opt-in and do not overwrite users          |
| `src/modules/*/*.module.ts`                                           | Feature wiring                                  | Controller/service/repository dependencies               |
| `src/modules/*/dto/*`                                                 | Input shape and update permissions              | Why PATCH should omit unchanged fields                   |
| `src/modules/*/*.entity.ts`                                           | Stored column shape                             | Nullable vs omitted vs defaults                          |
| `src/modules/*/*.controller.ts`                                       | HTTP routes and forwarding                      | What belongs in a controller and what does not           |
| `src/modules/*/*.service.ts`                                          | Feature rules, ownership, persistence           | The query and transaction boundary                       |
| `src/modules/auth/password.ts`, `auth.guard.ts`, `auth.decorators.ts` | Credential derivation, identity, route metadata | Hashing vs encryption; identity vs authorization         |
| `src/modules/transactions/transaction-facts.ts`                       | Positive amounts and fingerprint definition     | Why category is excluded from duplicate identity         |
| `src/modules/imports/csv-preview.ts`, `import.types.ts`               | CSV parsing and saved preview contract          | File errors vs row errors                                |
| `src/modules/insights/insight-rules*`                                 | Pure rules and boundary tests                   | Fact → threshold → explanation                           |
| `test/environment.ts`, `test/app.e2e-spec.ts`                         | Isolated PostgreSQL and HTTP proof              | Why an in-memory mock cannot prove locking/rollback      |
| `Dockerfile`, `compose.yaml`                                          | Reproducible runtime                            | Build vs migration vs API container                      |
| `.github/workflows/*`                                                 | Checks and manual image publishing              | A pipeline definition vs an executed green run           |
| `scripts/*`                                                           | Backup, restore and query-plan experiment       | Recovery verification and index evidence                 |
| `src/scripts/export-openapi.ts`, `docs/openapi.json`                  | Generated frontend contract                     | Regenerate it after API changes                          |

No additional repository wrapper or Specification framework was added because this starter did not already use one and the queries remain focused. SQL aggregate behavior is visible in the service that owns it.

## Lesson 1: DTO validation is a boundary

Open `create-account.dto.ts`, `update-account.dto.ts`, and `accounts.service.ts`. Create accepts type/currency; update deliberately does not. The DTO is a list of what the caller may change. Passing all request properties into an entity would permit privilege or ownership changes if the DTO were not strict.

`PartialType(..., {skipNullProperties:false})` permits omission without accepting null for non-nullable fields. Category/reference DTOs explicitly allow null where it means “clear.” `UpdateObligationDto` avoids inheriting the create default `isActive=true`; otherwise changing just the name could reactivate an inactive obligation. The HTTP test reproduces that risk.

Exercise: add a `nickname` field to accounts, nullable and at most 40 characters. Before writing code, identify the DTO, entity, migration, response schema, test and frontend-contract changes. Decide whether omission preserves it and null clears it. Implement and test both cases.

## Lesson 2: ownership belongs in the query

Inspect `AccountsService.owned()` and `TransactionsService.ownedQuery()`. A transaction is owned through its account. Queries join accounts and include the authenticated owner's ID; they do not fetch every transaction and filter in JavaScript.

Run the HTTP suite's foreign-account test, then reproduce it manually with two registered users. Explain why both a missing ID and a foreign ID return 404. List endpoints also scope the data; filtering by another user's account is rejected.

Exercise: add an account-specific count of transactions. Write the cross-user test first. The count must not leak whether another user's account has data.

## Lesson 3: money is a data-model decision

Try `0.1 + 0.2` in JavaScript, then inspect `money.ts`. PostgreSQL numeric and bigint minor units let `0.10 + 0.20` produce exactly `0.30`. The database driver intentionally returns amount strings. Percentages are display numbers; financial totals are not.

An account's manual balance snapshot can disagree with the net of the transactions entered so far. That is expected because the user may have imported only part of their history. Silently changing the snapshot after every import would create a false accounting model.

Exercise: add an API response showing the count of uncategorized expense rows for a requested month/currency. Ensure it includes only owned accounts and treats a date on the next month's first day correctly. Do not introduce currency conversion.

## Lesson 4: authentication has state

Trace register → password hash → session row → access JWT + refresh cookie. Explain the difference between the password hash and refresh token hash. Passwords are guessable, so scrypt makes guesses expensive. Refresh secrets are high-entropy random values, so a cryptographic hash is sufficient to avoid storing the raw secret.

Read the refresh transaction carefully. If the token is stale, the service commits revocation before returning 401. Throwing within the transaction would undo the revocation. This is a real example of “an error response” and “a database rollback” being different requirements.

The frontend must serialize refresh calls. Two simultaneous refreshes can produce one success followed by replay revocation. This is an intentional tradeoff, not a reason to remove the replay check casually. Every protected request checks the session so logout can invalidate access immediately.

Exercise: change access-token TTL via environment configuration and prove that a previously valid token expires. Then revoke a session before that expiry and explain why the same token stops working immediately. Do not print tokens in logs or commit them.

## Lesson 5: preview is not commit

Read `csv-preview.ts` first. It bounds bytes/records, decodes UTF-8, checks headers, and separates malformed-file errors from invalid-row reports. Then read `ImportsService.preview()`: it saves a report and checks already stored fingerprints.

Now read `ImportsService.commit()`. A saved preview may be outdated by the time the user clicks commit. The import lock handles duplicate commit requests for one import; `ON CONFLICT` and the transaction constraint handle two different previews with overlapping records. Insertion and the saved result share one PostgreSQL transaction.

The integration suite creates a temporary PostgreSQL trigger that rejects a specific synthetic row. It proves there are no inserted rows and the import remains PREVIEW after the failure. Removing the trigger allows the same import to be retried. That is stronger evidence than checking whether a mocked `save()` was called.

Exercise: take `synthetic-row-errors.csv`, predict its accepted/invalid/duplicate counts on paper, and compare with the API. Commit twice and explain why the result remains identical. Change the file's line ending and explain why its content hash changes but row duplicate detection still works.

## Lesson 6: aggregates are contracts

In `analytics.service.ts`, find the owner predicate, currency predicate and half-open date interval. Income, expenses, categories and prior-month data come from one repeatable-read snapshot. In `insights.service.ts`, the same snapshot is reused for budget facts so one rule evaluation does not mix moments in time.

In `budgets.service.ts`, spending is restricted to the budget's exact category, month, user and currency. Remaining may be negative. “80% used” and “exceeded” are different rules: exactly 100% is at the limit; more than 100% exceeds it.

Exercise: change the near-budget threshold from 80% to 85%. Update the rule's facts/explanation, version if you intend a public behavioral change, and boundary tests at 84.99%, 85%, and above 100%. The rule remains deterministic and does not need AI.

## Lesson 7: operate a failure

Use the operations runbook to inspect live/readiness endpoints, request logs and migration status. Run the query-plan experiment and explain the composite index order. Back up the synthetic database, restore into a separate empty database and reconcile the same sums. A successful `pg_dump` alone does not prove recovery.

Exercise: against a disposable test instance, make the database temporarily unreachable. Predict which health endpoint fails and which stays up. Restore connectivity and show the evidence. Do not run a failure drill against a shared/public demo with active users.

## How to work on the next feature

Write the behavior in four sentences: accepted inputs, successful output, failure cases, and ownership/transaction boundary. Sketch one request. Attempt a small implementation. Ask for a hint or a review about the narrow part you do not understand. Test success and failure, modify one requirement yourself, then explain the change without notes.

When you can do that, make one coherent commit explaining why the change exists. A useful example is “Preserve inactive obligation state when editing its name,” not “AI generated backend.” This build does not claim that you have already passed the ownership gate; use [OWNERSHIP_TRACKER.md](OWNERSHIP_TRACKER.md) to earn that evidence.

## Official references for the concepts

- [NestJS validation](https://docs.nestjs.com/techniques/validation): pipes, whitelist, mapped DTOs.
- [NestJS authentication](https://docs.nestjs.com/security/authentication): JWT and guards.
- [NestJS rate limiting](https://docs.nestjs.com/security/rate-limiting): process-level request limits.
- [Node crypto](https://nodejs.org/api/crypto.html): scrypt, randomness and constant-time comparison.
- [TypeORM PostgreSQL driver](https://typeorm.io/docs/drivers/postgres/): persistence options.
- [CSV parser record limits](https://csv.js.org/parse/options/max_record_size/): bounded parsing.

Use the versions pinned in `pnpm-lock.yaml` as the implementation reference; current documentation may describe newer major versions.
