# Stage 2 — Overview verification

Date: 2026-09-13. Scope: authenticated Overview only. No backend source, schema,
cookie policy, financial seed data, or management screens changed in this stage.
The worktree already contained authentication changes when this stage began.

## Automated and live API evidence

- Frontend lint, strict typecheck, all 32 tests (14 focused Overview tests), and
  the production build passed. Formatting and `git diff --check` passed too.
- Overview interaction tests cover API totals, separate obligations, negative
  remaining and >100% budget use, returned insight facts/version, Arabic/English
  switching, loading/empty/network/API-error states, section retry, scoped cache
  isolation/reuse, invalid month, current/future month messaging, and exact
  large-decimal formatting. They also cover explicit category/obligation loading
  and analytics-failure states rather than silent omission. The existing
  authentication regression tests run too.
- `node scripts/smoke-overview.mjs` passed against the actual local NestJS API.
  Login succeeded and the script's session was logged out with HTTP 204. No
  financial writes or reseeding were performed.

Observed September 2026 SAR values:

| API fact                       |                   Observed |
| ------------------------------ | -------------------------: |
| Income                         |                  12,300.00 |
| Spending                       |                   4,653.00 |
| Net                            |                   7,647.00 |
| Transactions                   |                         13 |
| Previous income / spending     |            0.00 / 4,000.00 |
| Spending change / percent      |            653.00 / 16.32% |
| Food limit / spent / remaining |   700.00 / 748.00 / -48.00 |
| Food utilization / exceeded    |             106.85% / true |
| Separate recurring estimate    |                   3,200.00 |
| Insight                        | BUDGET_EXCEEDED, version 1 |

Category spending returned: Housing 3,200.00; Food 748.00; Utilities 230.00;
Shopping 160.00; Entertainment 120.00; Transport 100.00; Health 95.00.
The insight's returned facts were `spent: "748.00"` and `limitAmount: "700.00"`
with the returned budget ID. Both Arabic and English disclaimers were present.
July/SAR and September/USD each returned zero transactions/totals and a null
comparison percentage. The UI does not derive totals from those category rows
or from a transaction page.

## Rendered checks still unverified

The browser integration could not initialize in this environment. An isolated
Chromium fallback was also attempted but the OS denied browser startup
(`MachPortRendezvousServer`, permission denied). No screenshots or rendered
responsive results were obtained. Next's development server also encountered
the environment's file-watcher limit (`EMFILE`); it was stopped. The production
build succeeded independently.

The failed development start left empty generated route types that conflicted
with the production route types during a later standalone typecheck. Those
generated development types were moved to an ignored `.next/failed-dev-types`
backup; the standalone typecheck then passed without source/config suppression.

CSS implements stacked summaries below 600px, a single section column below
1200px, keyboard-focusable horizontally scrollable financial tables, and the
existing responsive shell. This is implementation evidence, not visual proof.
DOM interaction tests verify locale/direction changes, not browser layout.

Before approving the stage, inspect the real frontend at **360px, 768px and
1440px**, in both languages:

- Sign in with the synthetic demo helper and select September 2026/SAR.
- Check the three totals, comparison, category table, budget's negative remaining,
  separately labeled obligation estimate, and expanded insight facts/version.
- Check typography, visible focus, table scrolling, no page-level overflow,
  mobile navigation, and LTR dates/amounts within Arabic layout.
- Switch to USD and July/SAR to check empty data and the null baseline wording.
- Refresh the page to verify the integrated Overview after session restoration;
  sign out and confirm the protected screen returns to login.
- Simulate a failed individual API request and verify the independent retry UI.

Do not treat these pending manual steps as passed. Real-browser auth/Overview
interaction, screenshots, and cross-browser layout remain unverified this stage.
