-- Read-only with respect to application tables: all synthetic benchmark rows live in a temporary table.
\set ON_ERROR_STOP on
BEGIN;
CREATE TEMP TABLE rasid_plan_transactions (
  id uuid NOT NULL, account_id uuid NOT NULL, posted_at date NOT NULL, amount numeric(18,2) NOT NULL
) ON COMMIT DROP;
INSERT INTO rasid_plan_transactions
SELECT md5(n::text)::uuid, md5((n % 100)::text)::uuid,
  date '2024-01-01' + ((n / 100) % 1000), ((n % 9999) + 1)::numeric / 100
FROM generate_series(1,100000) n;
ANALYZE rasid_plan_transactions;
\echo 'Baseline: no composite index'
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM rasid_plan_transactions
WHERE account_id = md5('42')::uuid AND posted_at >= date '2026-09-01' AND posted_at < date '2026-10-01'
ORDER BY posted_at DESC, id DESC LIMIT 20;
CREATE INDEX rasid_plan_account_date_idx ON rasid_plan_transactions(account_id, posted_at DESC, id DESC);
ANALYZE rasid_plan_transactions;
\echo 'After: matching composite index'
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM rasid_plan_transactions
WHERE account_id = md5('42')::uuid AND posted_at >= date '2026-09-01' AND posted_at < date '2026-10-01'
ORDER BY posted_at DESC, id DESC LIMIT 20;
ROLLBACK;
