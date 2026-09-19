# RASID frontend handoff — build in the next prompt

Build a small, responsive, Arabic-first demonstration frontend for the **existing RASID backend**. The purpose is to make backend behavior visible and understandable. Use the implemented API and [OpenAPI contract](openapi.json); do not invent banking integrations or fabricate successful server responses.

## Product identity and scope

The product name is **RASID**. Arabic is the default language and the default document direction is `rtl`. Keep the English brand spelling RASID. A suitable subtitle is «وضوح مالي من بيانات تجريبية». Show a persistent, readable notice: «بيانات تجريبية فقط — لا يوجد اتصال بالبنوك». Support an English toggle for the demo and reviewers.

Use a restrained visual style: clear type, ample spacing, neutral backgrounds, one primary accent, accessible contrast, and plain numeric summaries. This is a financial clarity dashboard, not a trading terminal. Avoid fake bank logos, fabricated connected-bank states, investment recommendations, celebratory profit claims, or a general AI chat interface. The implemented monthly analyst is a bounded evidence panel, not a bot persona.

The frontend should live in a separate `frontend/` directory and keep its build/dependencies separate from the Nest backend. A small TypeScript client with routing, forms, and query caching is enough. Select the actual UI stack when implementing; the backend contract is framework-independent.

## API connection and authentication

Local API base: `http://localhost:3000/api/v1`. Local frontend origin: `http://localhost:5173`. Swagger is at `http://localhost:3000/docs`. Configure the frontend API base using an environment variable, never a hard-coded production hostname. Exact browser origins must appear in backend `CORS_ORIGINS`.

Register/login return:

```ts
interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // seconds, default 900
  sessionId: string;
  user: {
    id: string;
    email: string;
    locale: 'ar' | 'en';
    timezone: string;
    createdAt: string;
    dataMode: 'DEMO_ONLY';
  };
}
```

The refresh secret is an **HttpOnly cookie**, not a JSON field. Use `credentials: 'include'` for login, register, refresh and logout. Hold the access token in memory; do not store tokens in localStorage or sessionStorage. Protected calls send `Authorization: Bearer <accessToken>`.

At startup, attempt one `POST /auth/refresh` with `X-RASID-Client: web`, `credentials: 'include'`, and no token body. On success, restore the in-memory session. On 401, show login. On a protected 401, perform one shared refresh operation and retry each waiting request once; if refresh fails, clear state and return to login. Do not keep retrying 401 responses.

**Serialize refresh across tabs**, not just within one component. The backend rotates the refresh token under a row lock and revokes a session on stale-token replay. Use a shared-tab lock (for example Web Locks where supported) and a BroadcastChannel for auth state/refresh completion, or a single-tab demo session fallback. Two concurrent refreshes can intentionally invalidate the session. Log out with `POST /auth/logout` using the same custom header; clear all user-scoped caches afterward. Session revocation also invalidates its access token immediately.

Production frontend/API should use HTTPS on the same site (for example app.example.com and api.example.com), or a same-origin reverse proxy. The refresh cookie is SameSite=Strict, Secure in production, host-only, and scoped to `/api/v1/auth`. An unrelated hosting domain will not work with this cookie policy. Do not weaken it as an unexplained UI workaround.

## Common types and display rules

```ts
type Currency = 'SAR' | 'USD' | 'EUR';
type Direction = 'INCOME' | 'EXPENSE';
type Money = string; // '42.50'; never calculate authoritative totals with Number
interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
interface ApiFailure {
  error: {
    code: string;
    message: string;
    messageAr: string;
    details?: unknown[];
  };
  requestId: string;
  timestamp: string;
}
```

Use the API's totals, not the sum of the currently visible transaction page. Keep a currency selector visible near analytics and budgets; never add SAR and USD balances into a single “total.” Use decimal-aware display formatting while preserving the exact amount string in forms and network requests. Percentages are presentation values; authoritative amounts are strings.

`postedAt` is `YYYY-MM-DD`, not an instant. Do not pass it through local-time conversion. Month filters are `YYYY-MM`. `createdAt`, `balanceAsOf`, and expiry fields are timestamps and may be formatted using the user's timezone. Keep ISO dates, emails, IDs, and code examples in an LTR span within the RTL layout. Arabic category names are in `nameAr`, English names in `nameEn`.

Successful responses are returned directly. Only page endpoints use `{data, meta}`. Categories and sessions return arrays. Budgets return `{month, currency, data}`; insights also have a `data` array but no pagination. See `docs/openapi.json` for full response schemas.

## Navigation and screens

Use a desktop sidebar and a compact mobile menu. Main destinations: Overview, Accounts, Transactions, CSV Imports, Budgets & Obligations, and Settings/Sessions. No native app or separate mobile product is needed.

### 1. Authentication

Implement login and registration forms with labeled fields, password visibility controls, pending/disabled submit state, and inline error feedback. Register uses `email`, `password` (12–128 characters), optional `locale` (`ar` default) and `timezone` (`Asia/Riyadh` default). Login uses email/password only. Provide a clearly labeled “synthetic demo account” helper using the credentials documented in README only for the demo deployment.

Do not offer password reset, social login, MFA, or email verification buttons because those endpoints do not exist. Display 409 email conflict, 401 invalid credentials, and 429 rate-limit states correctly.

### 2. Overview

Use `GET /analytics/monthly?month=2026-09&currency=SAR`, `GET /budgets?month=...&currency=...`, and `GET /insights?month=...&currency=...`.

Show income, spending, and net cards; a category breakdown with accessible labels/table; a previous-month comparison; current budgets; and recurring obligation estimates in their own section. A `null` previous-period percentage means “no comparable baseline,” not infinity or 0%. State when the selected month is incomplete. Obligations are recurring estimates, not proven unpaid bills, and must not be added to spending again.

Insights show `titleAr`/`titleEn`, the explanation, and an expandable “Why am I seeing this?” section rendering the returned facts and rule version. Keep the API's disclaimer visible.

The separate monthly analyst calls `POST /insights/explain` only after the user requests a briefing or submits one optional question (maximum 300 characters). Send `month`, `currency`, the current `locale`, and optional `question`. Render the returned status, answer, evidence labels/values, prompt version, and disclaimer. The browser never calls a model provider or receives an API key. A `503 AI_UNAVAILABLE` affects only this panel; deterministic totals and observations must stay visible.

For the untouched September 2026 seed, verify **income 12,300.00 SAR**, **spending 4,653.00 SAR**, and **net 7,647.00 SAR**. There are 13 September transactions across the two SAR accounts; a 14th transaction is in August. The food budget is 700.00, with spending 748.00 and remaining -48.00. Account balances are separate manual snapshots and do not have to equal net.

### 3. Accounts

Use `GET /accounts?page=1&limit=20`, `POST /accounts`, `GET /accounts/:id`, `PATCH /accounts/:id`, and `DELETE /accounts/:id`.

Create fields: `name` (1–80), `type` (`CURRENT`, `SAVINGS`, `CASH`), `currency`, `balance` decimal string (may be negative), and `balanceAsOf` timezone-aware timestamp. Call these manual accounts, never bank connections. Show “balance as of” alongside every balance.

Only name/balance/timestamp can be patched; type and currency are immutable in the API. When editing balance, send balance and timestamp together. The details view can link to a transaction list filtered by `accountId`. Confirm deletion in the UI; 409 means the account has referenced transactions/imports and cannot be deleted through this flow.

### 4. Transactions

Use `GET /transactions` with supported query parameters: `page`, `limit`, `accountId`, `categoryId`, `direction`, `currency`, `from`, `to`, `search`, `orderBy` (`postedAt`, `amount`, `createdAt`), and `order` (`ASC`, `DESC`). Defaults: page 1, limit 20, `postedAt DESC` with ID tie-breaker. Maximum limit 100. Date endpoints are inclusive for the list. Reset to page 1 when filters change.

Render date, merchant, account/currency, category, direction, amount and source. Load account/category dictionaries from their endpoints. Paginate dictionaries if necessary; never assume the first account page is the full set. Debounce literal merchant search. Show page controls and total count; avoid infinite-scroll assumptions with offset pagination.

Create with `POST /transactions`: accountId, postedAt, positive amount string, direction, merchant (1–160), optional categoryId and optional reference (1–100). Reference distinguishes otherwise identical purchases. `PATCH /transactions/:id` allows these fields except accountId. Send only changed keys. `categoryId: null` clears categorization; omission preserves it. `DELETE /transactions/:id` requires confirmation and then refreshes dependent queries.

409 `DUPLICATE_TRANSACTION` should explain the matching-record issue. Do not silently generate random references to bypass duplicate detection. Allow the user to add a meaningful distinguishing reference if the rows are truly different demo purchases.

### 5. CSV import wizard

1. Select an owned account and a UTF-8 `.csv` file. Show the 512 KiB / 1,000-record limits and synthetic-data notice before upload.
2. Send multipart `file` to `POST /imports/accounts/:accountId/preview`. Do not set multipart Content-Type manually; the browser supplies its boundary. No other form fields are accepted.
3. Display `summary.total`, `accepted`, `duplicates`, and `invalid`, plus `rows` with status, record fields (when valid), and errors. Row numbers are CSV record ordinals including the header; a quoted multiline cell still counts as one record.
4. Show an explicit checkbox if invalid rows exist: “I reviewed the errors; import accepted rows only.” Send `POST /imports/:id/commit` with `{acknowledgeRejectedRows: true}` when checked; otherwise `{}`. The client does not submit replacement transaction rows or selected row indices.
5. Show the committed `result.inserted`, `duplicates`, and `invalid`. These counts can differ from preview because another write may introduce duplicates before commit. Repeating commit returns the original result.

Required headers: `postedAt,amount,direction,merchant`. Optional: `categoryId,reference`. Header spelling/case is exact; unknown and duplicate headers fail. Use the supplied [valid fixture](../examples/synthetic-transactions.csv) and [row-error fixture](../examples/synthetic-row-errors.csv) as downloadable demo templates.

On a network timeout after commit, call `GET /imports/:id`; if still PREVIEW, retry the same commit. Never create a fresh import ID just to retry. If the preview response itself was lost, re-uploading identical bytes for the same account returns the existing import. Keep import history using `GET /imports?page=1&limit=20` and the details endpoint. A committed import is historical proof, not a reconciliation engine that resurrects transactions deleted later.

### 6. Budgets and obligations

Create a budget with `POST /budgets`: categoryId, month (`YYYY-MM`), currency, limitAmount. A second budget for the same user/category/month conflicts even in another currency. List by month/currency; `PATCH /budgets/:id` updates limitAmount only; DELETE removes it. Use `spent`, `remaining`, `utilizationPercent`, and `isExceeded` from the API. Cap the visual progress bar at 100% if needed but show the true percentage and negative remaining amount as text. Category budgets cover exactly that category, not its descendants.

Obligations use GET/POST `/obligations` and PATCH/DELETE `/obligations/:id`. Fields are name, positive amount, currency, dueDay (1–28), optional categoryId, and isActive. Show active/inactive state and recurring-estimate wording. Do not create automatic transactions, late fees, or “paid” status; the backend has no such model.

### 7. Categories and sessions

`GET /categories` returns shared and owned categories. POST accepts `nameAr`, `nameEn`, optional root parentId. PATCH changes names only. Shared categories cannot be edited or deleted by users. Private categories referenced by transactions, children, budgets or obligations cannot be deleted; surface 409.

`GET /auth/sessions` returns up to the 50 most recent session records. Display creation time, absolute expiry, revoked state and current-session marker from the login/refresh response's sessionId. `DELETE /auth/sessions/:id` revokes a session. Revoking the current session returns the UI to login. There are no device names, IP geolocation, or activity timestamps in the API; do not invent them.

## Loading, error, and accessibility behavior

Every data view needs distinct loading, empty, error, and success states. A network failure is not an empty month. Pending mutation buttons must prevent accidental repeated clicks; idempotency remains enforced by the backend. Never turn a failed request into a success toast.

Display `messageAr` by default, optionally `message` for English, and an expandable/copyable request ID. Map validation `details` fields to form controls using localized client copy. Show 401 as sign-in required, 404 as unavailable, 409 as conflict, 413 as file too large, 422 as preview acknowledgment required, 429 as retry later, and 503 as backend not ready. Respect Retry-After when provided. Avoid exposing raw stack traces or response objects to end users.

Use labels instead of placeholder-only inputs, keyboard-operable dialogs/menus, visible focus, live regions for asynchronous status, and table alternatives to charts. RTL must include navigation, dialogs and pagination, while amounts and ISO values remain legible. Test roughly 360px, 768px and 1440px layouts.

Invalidate transaction list, monthly analytics, budgets and insights after a transaction mutation or import commit. Invalidate accounts after snapshot updates; category dictionaries after category changes; obligations and analytics after obligation changes. Scope cache keys to the current user, currency and month, and clear them on sign-out.

## Frontend definition of done

- Register/login/refresh/logout and session revocation work with the actual API.
- An owned account can be created, edited and used for transactions.
- Transaction filtering and pagination retain the backend's ownership and money semantics.
- The untouched seed totals above reconcile; empty and zero-baseline months render correctly.
- Valid/invalid/duplicate CSV rows, explicit acceptance and retried commit can be demonstrated.
- Budget overspend, inactive obligations, and insight explanations reflect server facts.
- The optional monthly analyst is on-demand, renders server evidence, and fails without hiding deterministic data.
- Cross-user 404, invalid input, rate limiting and network failures produce honest UI states.
- Responsive RTL, keyboard navigation and readable form errors are checked.
- Frontend build and focused interaction tests pass; no tokens or real financial data are committed.

Suggested next prompt: **“Read docs/FRONTEND_HANDOFF.md and docs/openapi.json, then build RASID's responsive Arabic-first demo frontend against this backend. Preserve all documented contracts and verify success and failure states.”**
