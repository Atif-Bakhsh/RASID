# Accounts and transactions verification

Verification date: 2026-09-13 (Asia/Riyadh)

## Automated frontend checks

From `frontend/`, with `NEXT_PUBLIC_API_BASE_URL` set to the local API:

```text
pnpm lint       passed
pnpm typecheck  passed
pnpm test       13 files, 47 tests passed
pnpm build      passed; /accounts and /transactions prerendered
```

The focused tests cover all-page account dictionary loading, supported query
serialization, server pagination and filter resets, exact date and decimal-string
validation, changed-field PATCH bodies, explicit category clearing, immutable
account fields, paired balance/timestamp updates, per-user cache scoping,
duplicate transaction messaging, account deletion conflicts, and distinct
loading/error/empty/success states.
Dialog coverage also verifies initial focus, Tab containment, Escape dismissal and
focus restoration.

## Seeded-backend integration

`pnpm smoke:ledger` passed against `http://localhost:3000/api/v1`. The script used
the documented synthetic demo account and verified:

- account pagination, detail, creation, allowed update, deletion, and a real 409
  deletion conflict while a transaction referenced the account;
- transaction creation, server filters/order, update and deletion;
- exact `12.34` decimal strings and unchanged `2026-09-13` date-only values;
- `categoryId: null` clearing and preservation of omitted values;
- a real 409 `DUPLICATE_TRANSACTION` response;
- cleanup of every temporary record and restoration of September 2026 SAR totals:
  income `12300.00`, spending `4653.00`, net `7647.00`, 13 transactions.

The production server subsequently returned HTTP 200 for `/`, `/accounts`,
`/transactions`, and `/login`.

## Responsive check status

The implementation contains explicit desktop, tablet and mobile breakpoints,
single-column mobile forms, a stacked account master/detail layout, scrollable
transaction tables, mobile navigation, 44px-or-larger primary touch controls, and
LTR runs for dates, timestamps, IDs and money inside the RTL page.

Rendered screenshot inspection at 360px, 768px and 1440px remains unverified in
this environment: the available in-app browser failed during initialization before
navigation. This is not presented as visual proof and should be checked in a real
browser during review.
