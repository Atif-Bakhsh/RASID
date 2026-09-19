# A five-minute RASID engineering demo

Record this yourself after completing the ownership exercises. Do not read code you cannot explain. The backend can be demonstrated now through Swagger/curl; add UI clips after the frontend is implemented.

| Time      | Show                                                          | Explain                                                                                                  |
| --------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 0:00–0:30 | README scope and architecture                                 | Arabic-first clarity using synthetic data; one NestJS deployment and PostgreSQL                          |
| 0:30–1:15 | Login, account list, one manual transaction                   | Guard identifies the user; DTO validates shape; service enforces ownership; database protects invariants |
| 1:15–1:45 | Second user's token requesting the first user's account       | Safe 404 and the actual owner predicate in the query                                                     |
| 1:45–2:40 | Row-error CSV preview, acknowledgment and repeated commit     | Valid vs invalid vs duplicate; row lock and unique key; same result on retry                             |
| 2:40–3:15 | Monthly income/spending and category rows                     | Decimal strings, exact reconciliation, one currency, and date boundaries                                 |
| 3:15–3:40 | Overspent food budget and an insight's facts                  | The deterministic rule remains the calculation source                                                    |
| 3:40–4:05 | Generate the monthly analyst briefing and expand its evidence | Strict structured output, allow-listed aggregate facts, server-rendered evidence, safe 503 fallback      |
| 4:05–4:30 | Tests and injected database failure                           | Rollback is demonstrated with PostgreSQL, not just mocked repository calls                               |
| 4:30–4:50 | JSON request log and health/readiness                         | Follow one request ID; AI logs omit prompts/answers; alive and ready mean different things               |
| 4:50–5:00 | One tradeoff and one independent change                       | Why no agent/vector database/queue; show a change you made yourself                                      |

Before recording, use a fresh seed email if previous experiments changed data. The seed never silently resets an existing user. Hide tokens and cookie headers in the recording; the demo password is synthetic, but credential handling should still be deliberate.

Portfolio project text you can adapt after verifying it:

> Built RASID, an Arabic-first personal finance demo backend using NestJS and PostgreSQL. Implemented ownership-scoped queries, rotating sessions, exact-decimal analytics and transactional CSV imports with duplicate detection and idempotent retries. Verified concurrent writes, cross-user access failures and rollback using real PostgreSQL tests, then packaged the service with Docker and documented deployment and recovery procedures.

Only add a public URL, green CI claim, measured load claim, or recorded-recovery claim once you have that evidence. Do not describe this as a licensed fintech service or a bank integration.
