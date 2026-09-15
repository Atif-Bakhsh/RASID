# Stage 6 design, UX, and accessibility audit

Date: 2026-09-14

## Findings and changes

- Mobile navigation previously opened without moving keyboard focus into the menu
  and had no Escape behavior. Opening now focuses the first destination; Escape
  closes the panel and returns focus to its trigger. The closed panel is inert as
  well as visually hidden.
- Focus rings used the dark teal accent even on the inverse sidebar/header. Inverse
  controls now use the warm highlight focus treatment for clearer contrast.
- A few compact authentication actions were below the intended touch size. Demo
  and language actions now retain a 44px minimum height at small widths.
- Validation messages inside wrapping labels changed some controls' computed
  accessible names and were not explicitly referenced by the invalid field. Form
  controls now retain stable names and use `aria-describedby` to identify their
  matching messages; invalid selects receive the same visible error border as
  text inputs.
- Dialog focus setup reran whenever an inline close callback changed. The trap now
  initializes once, uses the latest close callback, restores prior focus, and uses
  a unique heading ID for accessible naming.
- Technical dates had visual LTR treatment but incomplete time semantics. ISO date
  and timestamp elements now include their matching `dateTime` value without
  timezone-converting transaction booking dates.
- Private child categories exposed a raw parent UUID in the visible hierarchy.
  They now resolve the parent through the API category dictionary and show an
  honest unavailable label if that record cannot be resolved.
- Obsolete foundation and authenticated holding-screen components and their stale
  stage copy and styles were removed. The shipped routes retain the restrained ledger layout;
  there are no placeholder stage cards, fake metrics, decorative charts, customer
  claims, AI branding, or component-library defaults.

## Responsive and RTL review

- The source audit covered the authenticated shell, auth routes, Overview, account
  master/detail, transaction filters/table, import review/history, management
  registers, forms, dialogs, and pagination.
- Existing breakpoints provide sidebar-to-mobile navigation at 980px, stacked data
  sections between 720px and 760px, and single-column forms/dialog sheets around
  460px to 480px. Wide transaction/import tables remain in explicitly scrollable
  regions instead of being squeezed into unreadable columns.
- Layout uses logical block/inline properties. Currency, exact money strings, IDs,
  emails, ISO timestamps, and `postedAt` remain isolated LTR runs inside Arabic RTL.
- Financial states use labels and rules in addition to color. Overspend retains the
  real API percentage and negative value as text.

## Accessibility review

- Forms retain visible labels, validation messages, pending prevention, and
  keyboard-operable controls.
- Shared dialogs trap Tab/Shift+Tab, close with Escape, restore focus, and expose
  `role="dialog"`, `aria-modal`, and a unique accessible title.
- Loading and mutation feedback uses status/alert semantics, request IDs remain
  expandable, and the global reduced-motion rule disables nonessential motion.
- Focus and mobile-menu interaction are covered by component tests, including the
  Arabic-to-English document direction switch.

## Verification and limitation

- `pnpm typecheck`, `pnpm lint`, and `pnpm test` passed after the audit (20 files,
  65 tests at this point).
- The in-app browser connection could not initialize in this environment because
  its runtime rejected a required built-in module import. Therefore 360px, 768px,
  and 1440px were audited through responsive source rules and interaction tests,
  not claimed as rendered screenshot verification. This remains explicit in the
  final risk report.
