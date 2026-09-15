# Stage 7 quality and integration verification

Date: 2026-09-14

## Definition-of-done review

- Authentication restoration, protected routing, one-refresh/one-retry behavior,
  logout cache clearing, and cross-tab coordination have focused frontend tests.
- Accounts, transactions, filters, dictionaries, exact money/date payloads, CSV
  recovery, budgets, obligations, categories, and sessions have behavioral tests.
- The live local synthetic seed reconciles September 2026 to income `12300.00`,
  spending `4653.00`, net `7647.00`, and 13 transactions. Food budget usage is
  `700.00` limit, `748.00` spent, `-48.00` remaining, `106.85%`, exceeded.
- Empty SAR and USD scopes and their null comparison percentage were checked against
  the actual API.

## Defect found and corrected

The budget mutation client was typed as if create/update returned calculated
`BudgetUsage`. The actual controller and OpenAPI contract return `BudgetRecord`;
calculated facts exist only on `GET /budgets`. The UI ignored the mutation body and
therefore did not show fabricated facts, but the client boundary was inaccurate.
The return types and mocks now match the backend, and integration verification reads
usage facts through the list endpoint.

## Manually verified

These are direct HTTP checks against the running seeded NestJS/PostgreSQL services,
performed by the repository smoke scripts:

- readiness, Swagger/OpenAPI availability, login cookie attributes, request IDs,
  exact September analytics, budget remaining, and disallowed-origin rejection;
- account pagination/detail/create/allowed edit/delete, nonempty deletion conflict,
  transaction create/filter/order/partial edit/category clearing/delete, duplicate
  conflict, and post-cleanup reconciliation;
- Overview totals, category facts, separate obligation interpretation, insight facts
  and rule version, September/USD empty data, and July/SAR zero baseline;
- current/other session listing, other-session revocation and immediate protected
  401, private-category creation and partial rename, budget create/list/edit/delete,
  cross-currency uniqueness conflict, inactive-obligation preservation, referenced
  category 409, and cleanup of every temporary management record.

All live mutation scripts use only synthetic records and remove their created data
in `finally`.

## Automatically verified

- Frontend Vitest: 21 files and 68 tests pass. Coverage includes auth restoration,
  refresh concurrency/loop prevention, route protection, error localization, exact
  API bodies, filter reset, cache invalidation, CSV timeout recovery, overspend,
  negative remaining, category conflict, current-session revocation, dialog focus,
  mobile-menu keyboard behavior, and Arabic/English direction switching.
- Backend HTTP/PostgreSQL E2E: 22 tests pass against a newly created isolated test
  database. These cover registration, authentication/revocation/rate limiting,
  ownership 404s, validation, exact money, pagination, duplicate 409, imports
  including 413/422/idempotency/rollback, budgets, obligations, categories, and
  migration revert/reapply.
- Stage 6 production build, frontend lint, and strict typecheck passed. The final
  full commands are rerun after launch-preparation changes.

## Cache audit

- Account mutations invalidate account pages/details by prefix and the complete
  account dictionary.
- Transaction and committed-import mutations invalidate transactions, analytics,
  budgets, and insights for the authenticated user.
- Budget mutations invalidate budgets and insights; obligation mutations invalidate
  obligations, monthly analytics, and insights.
- Category mutations invalidate the category dictionary and all views/selectors
  whose labels or exact-category facts can depend on it.
- Other-session revocation invalidates sessions only. Current-session revocation
  enters sign-out, which clears the complete in-memory user query cache.
- Query keys include user ID and their month/currency/filter/page scope; no
  cross-user cache key is shared.

## Could not verify

- Browser-rendered behavior at 360px, 768px, and 1440px could not be captured because
  the available browser-control runtime could not initialize. Responsive rules and
  interactions were audited in source and tests, but this is not screenshot proof.
- A live 503 was not induced because stopping the shared local database/API would
  disrupt the supplied environment. Network and server-error states are covered by
  frontend tests instead.
- No remote CI run, public host, production cookie, DNS, or real custom domain was
  available during this stage.

## Remaining risks

The main remaining product risk is visual/browser variance that static breakpoints
and jsdom cannot expose. Production same-site cookie, CORS, DNS, and HTTPS behavior
must be verified only after approved infrastructure and domains exist.
