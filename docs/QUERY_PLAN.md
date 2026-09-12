# Pagination and PostgreSQL index evidence

RASID uses explicit offset pagination: page 1, limit 20 by default, limit at most 100. Transactions default to `posted_at DESC, id DESC`; the unique ID is the tie-breaker. Query identifiers are selected from an allow-list. Filters are parameters and merchant search escapes SQL wildcard characters.

Offset pagination makes page counts and table navigation easy to demonstrate. It can become expensive on deep pages and concurrent inserts can shift later pages. Keyset pagination would be the next choice for sustained deep scrolling; it is not necessary to claim unlimited scalability for this MVP.

The migration creates `transactions_account_date_idx(account_id, posted_at DESC, id DESC)`. Leading account equality narrows the owned account; the booking date supports month filtering and default ordering; ID gives deterministic ties. Account ownership also has an index. Additional filter combinations may still sort or scan; one index is not a universal solution.

## Reproduce the isolated experiment

```sh
psql postgresql://rasid:rasid-local-demo-only@localhost:55432/rasid \
  -X -f scripts/query-plan.sql
```

The script builds 100,000 entirely synthetic rows in a temporary table, explains one account/month query before and after the matching composite index, and rolls back. It does not drop indexes on live application tables or retain benchmark rows.

Measured locally on PostgreSQL 17 in Docker on 2026-09-11:

| Plan | Returned rows | Execution time | Buffer evidence |
| --- | --- | --- | --- |
| No composite index: sequential scan then sort | 20 | 2.055 ms | 935 local buffer hits; 99,974 rows removed by filter |
| Composite index: ordered index scan | 20 | 0.023 ms | 19 local hits + 3 reads; no separate sort |

This is a narrow, cached, single-process index experiment, **not an API load test or production SLA**. Timing varies with hardware, cache and data distribution. Its engineering value is the change in access path and work performed. Run EXPLAIN on realistic data before adding more indexes; every index also costs writes and storage.

For the small seed dataset, PostgreSQL may correctly choose a sequential scan. Do not disable sequential scans or force an index merely to make a screenshot look impressive. Use `EXPLAIN (ANALYZE, BUFFERS)` and interpret rows, filter selectivity, sort nodes and buffer usage.
