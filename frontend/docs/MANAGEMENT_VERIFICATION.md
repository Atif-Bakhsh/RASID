# Stage 5 management verification

Date: 2026-09-14

## Implemented

- `/budgets` lists budgets by the selected month and currency, creates budgets,
  edits only `limitAmount`, and confirms deletion.
- Budget `spent`, `remaining`, `utilizationPercent`, and `isExceeded` values are
  displayed from the API. A progress track is capped visually at 100%, while the
  returned percentage and negative remaining amount remain visible unchanged.
- The same route lists paginated recurring obligation estimates and supports
  create, partial edit, active/inactive state, category clearing, and confirmed
  deletion. Copy explicitly separates estimates from paid bills and transactions.
- `/settings` separates shared read-only categories from private categories. It
  supports private-category creation, partial rename, confirmed deletion, and a
  specific 409 explanation when references prevent deletion.
- `/settings` lists only server-provided session identifiers and timestamps, marks
  the known current session, and supports revocation. Revoking the current session
  runs the normal sign-out path, which clears in-memory auth state and user cache.

## Semantics preserved

- Money is carried as decimal strings; no authoritative financial arithmetic is
  performed in the browser.
- Budget category matching remains exact; the UI does not promise child-category
  rollups.
- Obligations do not acquire invented paid, overdue, transaction, or late-fee state.
- Shared-category actions are absent, but backend ownership remains authoritative.
- Category PATCH and obligation PATCH bodies contain changed fields only. Clearing
  an obligation category sends `categoryId: null`; omission preserves it.
- Budget mutations invalidate budgets and insights. Obligation mutations invalidate
  obligations, analytics, and insights. Category mutations invalidate dictionaries
  and every selector/derived view that depends on them. Session revocation refreshes
  only the session list unless it is the current session.

## Verification performed

- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed: 19 files, 63 tests.
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1 pnpm build` passed and
  prerendered `/budgets` and `/settings`.
- Focused interaction tests cover API-authoritative overspend display, negative
  remaining, partial budget/obligation edits, shared-category permissions, category
  deletion conflict messaging, current-session identification, and current-session
  revocation.

## Remaining at this stage

Live seeded-backend mutation checks and rendered viewport checks are recorded in the
Stage 7 integration report after the full design audit. The initial `pnpm check`
build step failed only because the required public API environment variable was not
set; the same production build passed after supplying the documented local value
above.
