# RASID decisions and acceptance evidence

This implements the supplied portfolio MVP under the name **RASID**. The repository began as a NestJS 11 starter with no existing feature modules.

| Requirement | Chosen contract | Evidence |
| --- | --- | --- |
| Auth and ownership | Short-lived access JWT, rotating opaque refresh cookie, PostgreSQL session revocation; invisible resources return 404 | Auth/ownership HTTP tests |
| Manual accounts | SAR/USD/EUR; balance is a separately dated snapshot, never silently recalculated | Account validation and snapshot tests |
| Transactions | Positive decimal string + INCOME/EXPENSE; date-only booking date; mutable manual records and categorization | Validation, duplicate, pagination and analytics tests |
| CSV | UTF-8, 512 KiB, 1,000 data rows; persisted preview; partial valid-row acceptance; one transactional commit per preview | Bad-file, row-error, concurrent retry and rollback tests |
| Deduplication | Unique per account by normalized booking facts + optional reference; category is excluded | Duplicate and category-change tests |
| Analytics | One requested currency at a time; calendar booking months; previous-month comparison; no FX conversion | Exact-decimal reconciliation and owner isolation tests |
| Budgets | One budget per user/category/month, in a chosen currency; expenses of that exact category; remaining can be negative | Constraint and edge tests |
| Obligations | Explicit recurring monthly estimates due on days 1–28; not generated transactions or historical payment tracking | Projection and exclusion tests |
| Insights | Versioned deterministic rules with input facts, thresholds, bilingual explanation | Rule boundary tests |
| Operations | One API and PostgreSQL; Docker, CI, release image, logs, readiness, backup/restore drill | Runtime checks and runbook |
| Teaching and frontend | Request walkthroughs, change exercises, frontend API/UX contract in Markdown | LEARNING_GUIDE.md and FRONTEND_HANDOFF.md |

No bank integration, real financial data, money movement, investment execution, live market feed, AI dependency, queues, Redis, or microservices. User-requested frontend implementation is deferred to a later prompt.

Amounts use two decimal places and travel as strings. Arithmetic uses PostgreSQL numeric or TypeScript bigint minor units. User locale/timezone are preferences; `postedAt` is a booking **date**, so it does not shift with browser timezones. Category parents organize the picker; budget totals do not automatically include descendants.

Identical purchases on the same day can collide without a distinct `reference`; supply a stable reference when they are separate real-world demo records. Deleting or editing a committed transaction does not reset its import: repeating a committed import returns its original result, never resurrects edited/deleted records.

Public deployment and a recorded demo require an actual hosting target and Atif's recording. The repo supplies the runnable backend, release configuration, and rehearsal guide; it cannot establish personal understanding or claim an unperformed deployment.
