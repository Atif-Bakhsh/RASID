import { testBaseUrl, testDatabaseName } from './environment';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import { Server } from 'node:http';
import request, { Response } from 'supertest';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

interface AuthBody {
  accessToken: string;
  sessionId: string;
  user: { id: string; email: string };
  refreshToken?: string;
}
interface RecordBody {
  id: string;
  balance: string;
  amount: string;
  merchant: string;
  categoryId: string | null;
  postedAt: string;
  isActive: boolean;
}
interface Page<T> {
  data: T[];
  meta: { total: number; totalPages: number; page: number; limit: number };
}
interface ImportBody {
  id: string;
  status: string;
  summary: { accepted: number; invalid: number; duplicates: number };
  result: { inserted: number; invalid: number; duplicates: number } | null;
}
interface Monthly {
  income: string;
  spending: string;
  net: string;
  transactionCount: number;
  categories: { spending: string }[];
  comparison: { spending: string; spendingChangePercent: number | null };
  obligations: { total: string; items: { dueDate: string }[] };
}
const body = <T>(res: Response) => res.body as T;
function cookieHeader(res: Response): string {
  const values: unknown = res.headers['set-cookie'];
  if (!Array.isArray(values) || typeof values[0] !== 'string')
    throw new Error('Expected refresh cookie');
  return values[0];
}
const cookie = (res: Response) => cookieHeader(res).split(';')[0];
const food = '10000000-0000-4000-8000-000000000002';
const accountDto = {
  name: 'حساب اصطناعي',
  type: 'CURRENT',
  currency: 'SAR',
  balance: '5000.00',
  balanceAsOf: '2026-09-01T00:00:00Z',
};
const csvHeader = 'postedAt,amount,direction,merchant,categoryId,reference';

describe('RASID real PostgreSQL HTTP contract', () => {
  let app: NestExpressApplication<Server>;
  let db: DataSource;
  let admin: Client;
  let databaseName: string;
  let alice: AuthBody;
  let bob: AuthBody;
  let aliceCookie: string;
  let account: RecordBody;
  let foreign: RecordBody;
  let transaction: RecordBody;
  const password = 'Synthetic-Tests-Only-2026!';
  const api = () => request(app.getHttpServer());
  const auth = (token = alice.accessToken) => ({
    Authorization: `Bearer ${token}`,
  });
  const upload = (
    csv: string,
    name = 'synthetic.csv',
    accountId = account.id,
  ) =>
    api()
      .post(`/api/v1/imports/accounts/${accountId}/preview`)
      .set(auth())
      .attach('file', Buffer.from(csv), {
        filename: name,
        contentType: 'text/csv',
      });

  beforeAll(async () => {
    // Each run owns a new database; it never resets an existing database.
    admin = new Client({ connectionString: testBaseUrl });
    await admin.connect();
    databaseName = testDatabaseName;
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication<NestExpressApplication<Server>>({
      bodyParser: false,
      logger: false,
    });
    setupApp(app);
    db = app.get(DataSource);
    await db.runMigrations();
    await app.init();
    const a = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'ALICE@example.test', password })
      .expect(201);
    alice = body<AuthBody>(a);
    aliceCookie = cookie(a);
    bob = body<AuthBody>(
      await api()
        .post('/api/v1/auth/register')
        .send({ email: 'bob@example.test', password })
        .expect(201),
    );
    account = body<RecordBody>(
      await api()
        .post('/api/v1/accounts')
        .set(auth())
        .send(accountDto)
        .expect(201),
    );
    foreign = body<RecordBody>(
      await api()
        .post('/api/v1/accounts')
        .set(auth(bob.accessToken))
        .send(accountDto)
        .expect(201),
    );
  });
  afterAll(async () => {
    if (app) await app.close();
    if (admin) {
      if (/^rasid_test_[a-f0-9]{16}$/.test(databaseName))
        await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
      await admin.end();
    }
  });

  it('exposes liveness, migration-aware readiness, and request IDs', async () => {
    await api()
      .get('/api/v1/health/live')
      .set('X-Request-ID', 'test-request-123')
      .expect(200)
      .expect('X-Request-ID', 'test-request-123');
    await api().get('/api/v1/health/ready').expect(200);
    await db.query(
      "UPDATE migrations SET name = 'TemporarilyPending' WHERE name = 'InitialSchema1788998400000'",
    );
    try {
      await api().get('/api/v1/health/ready').expect(503);
    } finally {
      await db.query(
        "UPDATE migrations SET name = 'InitialSchema1788998400000' WHERE name = 'TemporarilyPending'",
      );
    }
  });
  it('stores only credential hashes, canonicalizes email, and conceals secrets', async () => {
    expect(alice.user.email).toBe('alice@example.test');
    expect(alice.refreshToken).toBeUndefined();
    const [user] = await db.query<{ password_hash: string }[]>(
      'SELECT password_hash FROM users WHERE id=$1',
      [alice.user.id],
    );
    expect(user.password_hash).toMatch(/^scrypt-v1\$/);
    expect(user.password_hash).not.toContain(password);
    const [session] = await db.query<{ refresh_token_hash: string }[]>(
      'SELECT refresh_token_hash FROM sessions WHERE id=$1',
      [alice.sessionId],
    );
    expect(session.refresh_token_hash).toHaveLength(64);
    await api()
      .post('/api/v1/auth/register')
      .send({ email: 'alice@example.test', password })
      .expect(409);
    expect(
      JSON.stringify(
        (await api().get('/api/v1/auth/sessions').set(auth()).expect(200)).body,
      ),
    ).not.toContain('refreshTokenHash');
    expect(
      JSON.stringify(
        (await api().get('/api/v1/auth/me').set(auth()).expect(200)).body,
      ),
    ).not.toContain('passwordHash');
  });
  it('rejects invalid bodies and unauthenticated access with consistent safe errors', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'bad', password: 'short', userId: bob.user.id })
      .expect(400);
    expect(
      body<{ error: { code: string }; requestId: string }>(res),
    ).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(JSON.stringify(res.body)).not.toContain('short');
    await api()
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.test', password: 'Wrong-Password-Here!' })
      .expect(401);
    await api().get('/api/v1/accounts').expect(401);
    await api()
      .post('/api/v1/insights/explain')
      .send({ currency: 'SAR', locale: 'en' })
      .expect(401);
    await api()
      .post('/api/v1/insights/explain')
      .set(auth())
      .send({ currency: 'SAR', locale: 'en', question: 'x'.repeat(301) })
      .expect(400);
    const aiUnavailable = await api()
      .post('/api/v1/insights/explain')
      .set(auth())
      .send({ month: '2026-09', currency: 'SAR', locale: 'en' })
      .expect(503);
    expect(body<{ error: { code: string } }>(aiUnavailable)).toMatchObject({
      error: { code: 'AI_UNAVAILABLE' },
    });
    await api().get('/api/v1/accounts').set(auth('forged')).expect(401);
    await api().get('/api/v1/accounts/not-a-uuid').set(auth()).expect(400);
    for (const extra of [
      { currency: 'JPY' },
      { balance: 0.1 },
      { userId: bob.user.id },
    ])
      await api()
        .post('/api/v1/accounts')
        .set(auth())
        .send({ ...accountDto, ...extra })
        .expect(400);
  });
  it('preserves balance snapshots and omitted PATCH fields', async () => {
    for (const fields of [
      { balance: '10.00' },
      { name: null },
      { currency: 'USD' },
    ])
      await api()
        .patch(`/api/v1/accounts/${account.id}`)
        .set(auth())
        .send(fields)
        .expect(400);
    expect(
      body<RecordBody>(
        await api()
          .patch(`/api/v1/accounts/${account.id}`)
          .set(auth())
          .send({ name: 'Renamed demo' })
          .expect(200),
      ).balance,
    ).toBe('5000.00');
  });
  it('makes foreign accounts and sessions inaccessible', async () => {
    await api().get(`/api/v1/accounts/${foreign.id}`).set(auth()).expect(404);
    await api()
      .patch(`/api/v1/accounts/${foreign.id}`)
      .set(auth())
      .send({ name: 'intruder' })
      .expect(404);
    await api()
      .delete(`/api/v1/accounts/${foreign.id}`)
      .set(auth())
      .expect(404);
    await api()
      .delete(`/api/v1/auth/sessions/${bob.sessionId}`)
      .set(auth())
      .expect(404);
    expect(
      body<Page<RecordBody>>(
        await api().get('/api/v1/accounts').set(auth()).expect(200),
      ).data.map((item) => item.id),
    ).toEqual([account.id]);
  });
  it('creates owned transactions and handles simultaneous duplicates', async () => {
    const dto = {
      accountId: account.id,
      postedAt: '2026-09-01',
      amount: '0.10',
      direction: 'EXPENSE',
      merchant: 'Coffee',
      categoryId: food,
    };
    const attempts = await Promise.all(
      [1, 2].map(() =>
        api().post('/api/v1/transactions').set(auth()).send(dto),
      ),
    );
    expect(attempts.map((res) => res.status).sort()).toEqual([201, 409]);
    transaction = body<RecordBody>(attempts.find((res) => res.status === 201)!);
    for (const extra of [
      { amount: '0.20', merchant: 'Tea' },
      {
        amount: '100.00',
        direction: 'INCOME',
        merchant: 'Synthetic salary',
        categoryId: null,
      },
      { postedAt: '2026-08-31', amount: '10.00', merchant: 'Prior month' },
      { postedAt: '2026-10-01', amount: '25.00', merchant: 'Next month' },
    ])
      await api()
        .post('/api/v1/transactions')
        .set(auth())
        .send({ ...dto, ...extra })
        .expect(201);
    await api()
      .post('/api/v1/transactions')
      .set(auth(bob.accessToken))
      .send({ ...dto, accountId: foreign.id, amount: '999.00' })
      .expect(201);
    await api()
      .post('/api/v1/transactions')
      .set(auth())
      .send({ ...dto, accountId: foreign.id })
      .expect(404);
    await api()
      .get(`/api/v1/transactions/${transaction.id}`)
      .set(auth(bob.accessToken))
      .expect(404);
    await api()
      .patch(`/api/v1/transactions/${transaction.id}`)
      .set(auth(bob.accessToken))
      .send({ merchant: 'intruder' })
      .expect(404);
    await api()
      .delete(`/api/v1/transactions/${transaction.id}`)
      .set(auth(bob.accessToken))
      .expect(404);
  });
  it('provides stable pagination, literal search, and allow-listed ordering', async () => {
    const route =
      '/api/v1/transactions?from=2026-09-01&to=2026-09-30&direction=EXPENSE&currency=SAR&limit=1';
    const first = body<Page<RecordBody>>(
      await api().get(route).set(auth()).expect(200),
    );
    const second = body<Page<RecordBody>>(
      await api().get(`${route}&page=2`).set(auth()).expect(200),
    );
    expect(first.meta).toMatchObject({ total: 2, totalPages: 2 });
    expect(first.data[0].id).not.toBe(second.data[0].id);
    expect(
      body<Page<RecordBody>>(
        await api()
          .get('/api/v1/transactions?search=%25')
          .set(auth())
          .expect(200),
      ).meta.total,
    ).toBe(0);
    expect(
      body<Page<RecordBody>>(
        await api()
          .get('/api/v1/transactions?search=coffEE')
          .set(auth())
          .expect(200),
      ).data[0].id,
    ).toBe(transaction.id);
    for (const query of [
      'orderBy=password_hash',
      'limit=101',
      'from=2026-09-30&to=2026-09-01',
    ])
      await api().get(`/api/v1/transactions?${query}`).set(auth()).expect(400);
    await api()
      .get(`/api/v1/transactions?accountId=${foreign.id}`)
      .set(auth())
      .expect(404);
  });
  it('reconciles exact totals, categories, dates, and per-currency ownership', async () => {
    const usd = body<RecordBody>(
      await api()
        .post('/api/v1/accounts')
        .set(auth())
        .send({ ...accountDto, currency: 'USD' })
        .expect(201),
    );
    await api()
      .post('/api/v1/transactions')
      .set(auth())
      .send({
        accountId: usd.id,
        postedAt: '2026-09-01',
        amount: '999.99',
        direction: 'EXPENSE',
        merchant: 'USD only',
      })
      .expect(201);
    const facts = body<Monthly>(
      await api()
        .get('/api/v1/analytics/monthly?month=2026-09&currency=SAR')
        .set(auth())
        .expect(200),
    );
    expect(facts).toMatchObject({
      income: '100.00',
      spending: '0.30',
      net: '99.70',
      transactionCount: 3,
      comparison: { spending: '10.00' },
    });
    expect(facts.categories.map((item) => item.spending)).toEqual(['0.30']);
    expect(
      body<RecordBody>(
        await api()
          .get(`/api/v1/accounts/${account.id}`)
          .set(auth())
          .expect(200),
      ).balance,
    ).toBe('5000.00');
    expect(
      body<Monthly>(
        await api()
          .get('/api/v1/analytics/monthly?month=2025-01')
          .set(auth())
          .expect(200),
      ),
    ).toMatchObject({
      income: '0.00',
      spending: '0.00',
      comparison: { spendingChangePercent: null },
    });
  });
  it('rejects invalid transaction values and retains omitted fields on update', async () => {
    const dto = {
      accountId: account.id,
      postedAt: '2026-09-01',
      amount: '1',
      direction: 'EXPENSE',
      merchant: 'Invalid',
    };
    for (const extra of [
      { amount: '0' },
      { amount: '-1' },
      { amount: '0.001' },
      { postedAt: '2026-02-30' },
      { direction: 'TRANSFER' },
    ])
      await api()
        .post('/api/v1/transactions')
        .set(auth())
        .send({ ...dto, ...extra })
        .expect(400);
    await api()
      .patch(`/api/v1/transactions/${transaction.id}`)
      .set(auth())
      .send({ amount: null })
      .expect(400);
    expect(
      body<RecordBody>(
        await api()
          .patch(`/api/v1/transactions/${transaction.id}`)
          .set(auth())
          .send({ merchant: 'قهوة معدلة' })
          .expect(200),
      ),
    ).toMatchObject({
      amount: '0.10',
      postedAt: '2026-09-01',
      categoryId: food,
    });
  });
  it('protects private categories and their references', async () => {
    const category = body<RecordBody>(
      await api()
        .post('/api/v1/categories')
        .set(auth(bob.accessToken))
        .send({ nameAr: 'خاص', nameEn: 'Private' })
        .expect(201),
    );
    await api()
      .patch(`/api/v1/transactions/${transaction.id}`)
      .set(auth())
      .send({ categoryId: category.id })
      .expect(404);
    await api()
      .patch(`/api/v1/categories/${category.id}`)
      .set(auth())
      .send({ nameEn: 'intruder' })
      .expect(404);
    expect(
      body<RecordBody[]>(
        await api().get('/api/v1/categories').set(auth()).expect(200),
      ).map((item) => item.id),
    ).not.toContain(category.id);
    await api().delete(`/api/v1/categories/${food}`).set(auth()).expect(404);
    const own = body<RecordBody>(
      await api()
        .post('/api/v1/categories')
        .set(auth())
        .send({ nameAr: 'فرعي', nameEn: 'Child', parentId: food })
        .expect(201),
    );
    await api()
      .post('/api/v1/categories')
      .set(auth())
      .send({ nameAr: 'عميق', nameEn: 'Deep', parentId: own.id })
      .expect(400);
    await api()
      .patch(`/api/v1/transactions/${transaction.id}`)
      .set(auth())
      .send({ categoryId: own.id })
      .expect(200);
    await api().delete(`/api/v1/categories/${own.id}`).set(auth()).expect(409);
    await api()
      .patch(`/api/v1/transactions/${transaction.id}`)
      .set(auth())
      .send({ categoryId: food })
      .expect(200);
    await api().delete(`/api/v1/categories/${own.id}`).set(auth()).expect(204);
  });
  it('computes budget overspend, protects ownership, and keeps obligations separate', async () => {
    const budget = body<RecordBody>(
      await api()
        .post('/api/v1/budgets')
        .set(auth())
        .send({
          categoryId: food,
          month: '2026-09',
          currency: 'SAR',
          limitAmount: '0.25',
        })
        .expect(201),
    );
    await api()
      .post('/api/v1/budgets')
      .set(auth())
      .send({
        categoryId: food,
        month: '2026-09',
        currency: 'USD',
        limitAmount: '10',
      })
      .expect(409);
    const budgets = body<{
      data: { remaining: string; spent: string; isExceeded: boolean }[];
    }>(
      await api().get('/api/v1/budgets?month=2026-09').set(auth()).expect(200),
    );
    expect(budgets.data[0]).toMatchObject({
      remaining: '-0.05',
      spent: '0.30',
      isExceeded: true,
    });
    await api()
      .patch(`/api/v1/budgets/${budget.id}`)
      .set(auth(bob.accessToken))
      .send({ limitAmount: '100' })
      .expect(404);
    await api()
      .delete(`/api/v1/budgets/${budget.id}`)
      .set(auth(bob.accessToken))
      .expect(404);
    const obligation = body<RecordBody>(
      await api()
        .post('/api/v1/obligations')
        .set(auth())
        .send({
          name: 'Rent estimate',
          amount: '30',
          currency: 'SAR',
          dueDay: 5,
        })
        .expect(201),
    );
    await api()
      .patch(`/api/v1/obligations/${obligation.id}`)
      .set(auth(bob.accessToken))
      .send({ name: 'intruder' })
      .expect(404);
    expect(
      body<Monthly>(
        await api()
          .get('/api/v1/analytics/monthly?month=2026-09')
          .set(auth())
          .expect(200),
      ),
    ).toMatchObject({
      spending: '0.30',
      obligations: { total: '30.00', items: [{ dueDate: '2026-09-05' }] },
    });
    expect(
      body<{ data: { rule: string }[] }>(
        await api()
          .get('/api/v1/insights?month=2026-09')
          .set(auth())
          .expect(200),
      ).data.map((item) => item.rule),
    ).toContain('BUDGET_EXCEEDED');
    await api()
      .patch(`/api/v1/obligations/${obligation.id}`)
      .set(auth())
      .send({ isActive: false })
      .expect(200);
    expect(
      body<RecordBody>(
        await api()
          .patch(`/api/v1/obligations/${obligation.id}`)
          .set(auth())
          .send({ name: 'Still inactive' })
          .expect(200),
      ).isActive,
    ).toBe(false);
    await api()
      .post('/api/v1/obligations')
      .set(auth())
      .send({ name: 'Bad date', amount: '1', currency: 'SAR', dueDay: 31 })
      .expect(400);
  });
  it('previews row errors and commits exactly once under concurrent retries', async () => {
    const csv = `${csvHeader}\n2026-09-10,12.50,EXPENSE,CSV coffee,${food},csv-1\n2026-09-10,12.5,EXPENSE,CSV coffee,${food},csv-1\n2026-09-10,-5,EXPENSE,Bad,,\n2026-09-11,8,EXPENSE,CSV tea,${food},csv-2`;
    const preview = body<ImportBody>(await upload(csv).expect(201));
    expect(preview.summary).toMatchObject({
      accepted: 2,
      duplicates: 1,
      invalid: 1,
    });
    expect(body<ImportBody>(await upload(csv).expect(201)).id).toBe(preview.id);
    await api()
      .get(`/api/v1/imports/${preview.id}`)
      .set(auth(bob.accessToken))
      .expect(404);
    await api()
      .post(`/api/v1/imports/${preview.id}/commit`)
      .set(auth(bob.accessToken))
      .send({})
      .expect(404);
    await api()
      .post(`/api/v1/imports/${preview.id}/commit`)
      .set(auth())
      .send({})
      .expect(422);
    const attempts = await Promise.all(
      [1, 2].map(() =>
        api()
          .post(`/api/v1/imports/${preview.id}/commit`)
          .set(auth())
          .send({ acknowledgeRejectedRows: true })
          .expect(200),
      ),
    );
    for (const res of attempts)
      expect(body<ImportBody>(res)).toMatchObject({
        status: 'COMMITTED',
        result: { inserted: 2, duplicates: 1, invalid: 1 },
      });
    expect(
      (
        await db.query<{ count: number }[]>(
          'SELECT count(*)::int AS count FROM transactions WHERE import_id=$1',
          [preview.id],
        )
      )[0].count,
    ).toBe(2);
    expect(
      body<Monthly>(
        await api()
          .get('/api/v1/analytics/monthly?month=2026-09')
          .set(auth())
          .expect(200),
      ).spending,
    ).toBe('20.80');
    expect(body<ImportBody>(await upload(csv).expect(201)).status).toBe(
      'COMMITTED',
    );
  });
  it('deduplicates overlapping independent previews at commit time', async () => {
    const row = `2026-09-12,5,EXPENSE,Overlap,${food},overlap`;
    const previews = await Promise.all(
      ['', '\n'].map((suffix) =>
        upload(`${csvHeader}\n${row}${suffix}`).expect(201),
      ),
    );
    const results = await Promise.all(
      previews.map((res) =>
        api()
          .post(`/api/v1/imports/${body<ImportBody>(res).id}/commit`)
          .set(auth())
          .send({})
          .expect(200),
      ),
    );
    expect(
      results.map((res) => body<ImportBody>(res).result!.inserted).sort(),
    ).toEqual([0, 1]);
  });
  it('rolls back both rows and status on database failure, then retries successfully', async () => {
    const preview = body<ImportBody>(
      await upload(
        `${csvHeader}\n2026-09-15,1,EXPENSE,First,,rollback-1\n2026-09-15,2,EXPENSE,FAIL_TEST_ONLY,,rollback-2`,
      ).expect(201),
    );
    await db.query(
      `CREATE FUNCTION rasid_test_reject_row() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.merchant = 'FAIL_TEST_ONLY' THEN RAISE EXCEPTION 'injected failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER rasid_test_failure BEFORE INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION rasid_test_reject_row();`,
    );
    try {
      await api()
        .post(`/api/v1/imports/${preview.id}/commit`)
        .set(auth())
        .send({})
        .expect(500);
      expect(
        (
          await db.query<{ count: number }[]>(
            'SELECT count(*)::int AS count FROM transactions WHERE import_id=$1',
            [preview.id],
          )
        )[0].count,
      ).toBe(0);
      expect(
        body<ImportBody>(
          await api()
            .get(`/api/v1/imports/${preview.id}`)
            .set(auth())
            .expect(200),
        ).status,
      ).toBe('PREVIEW');
    } finally {
      await db.query(
        'DROP TRIGGER rasid_test_failure ON transactions; DROP FUNCTION rasid_test_reject_row()',
      );
    }
    expect(
      body<ImportBody>(
        await api()
          .post(`/api/v1/imports/${preview.id}/commit`)
          .set(auth())
          .send({})
          .expect(200),
      ).result!.inserted,
    ).toBe(2);
  });
  it('rejects missing/oversized/wrong-type/foreign uploads and nonempty account deletion', async () => {
    await api()
      .post(`/api/v1/imports/accounts/${account.id}/preview`)
      .set(auth())
      .expect(400);
    await upload(csvHeader, 'foreign.csv', foreign.id).expect(404);
    await upload('x'.repeat(512 * 1024 + 1), 'large.csv').expect(413);
    await upload('not csv', 'file.exe').expect(400);
    await api()
      .delete(`/api/v1/accounts/${account.id}`)
      .set(auth())
      .expect(409);
  });
  it('enforces database invariants even when HTTP is bypassed', async () => {
    await expect(
      db.query(
        'INSERT INTO transactions(account_id,posted_at,amount,direction,merchant,fingerprint) VALUES ($1,$2,$3,$4,$5,$6)',
        [
          account.id,
          '2026-09-01',
          '-1.00',
          'EXPENSE',
          'Bad direct insert',
          randomUUID(),
        ],
      ),
    ).rejects.toMatchObject({ driverError: { code: '23514' } });
    await expect(
      db.query(
        'INSERT INTO imports(user_id,account_id,filename,content_hash,rows) VALUES ($1,$2,$3,$4,$5)',
        [alice.user.id, foreign.id, 'bad.csv', 'x'.repeat(64), '[]'],
      ),
    ).rejects.toMatchObject({ driverError: { code: '23503' } });
  });
  it('rejects CSRF, rotates refresh tokens, and persists revocation on replay', async () => {
    await api()
      .post('/api/v1/auth/refresh')
      .set('Cookie', aliceCookie)
      .expect(403);
    await api()
      .post('/api/v1/auth/refresh')
      .set('Cookie', aliceCookie)
      .set('X-RASID-Client', 'web')
      .set('Origin', 'https://evil.example')
      .expect(403);
    const next = await api()
      .post('/api/v1/auth/refresh')
      .set('Cookie', aliceCookie)
      .set('X-RASID-Client', 'web')
      .expect(200);
    expect(cookie(next)).not.toBe(aliceCookie);
    await api()
      .post('/api/v1/auth/refresh')
      .set('Cookie', aliceCookie)
      .set('X-RASID-Client', 'web')
      .expect(401);
    await api()
      .get('/api/v1/auth/me')
      .set(auth(body<AuthBody>(next).accessToken))
      .expect(401);
    expect(
      (
        await db.query<{ revoked_at: Date | null }[]>(
          'SELECT revoked_at FROM sessions WHERE id=$1',
          [alice.sessionId],
        )
      )[0].revoked_at,
    ).not.toBeNull();
  });
  it('rejects expired access tokens and expired refresh sessions', async () => {
    const expiredJwt = app.get(JwtService).sign(
      { sub: bob.user.id, sid: bob.sessionId },
      {
        expiresIn: -1,
        algorithm: 'HS256',
        issuer: 'rasid',
        audience: 'rasid-api',
      },
    );
    await api().get('/api/v1/auth/me').set(auth(expiredJwt)).expect(401);
    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.test', password })
      .expect(200);
    const session = body<AuthBody>(login);
    await db.query(
      "UPDATE sessions SET expires_at = now() - interval '1 second' WHERE id=$1",
      [session.sessionId],
    );
    await api()
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie(login))
      .set('X-RASID-Client', 'web')
      .expect(401);
    await api()
      .get('/api/v1/auth/me')
      .set(auth(session.accessToken))
      .expect(401);
  });
  it('serializes concurrent refresh and revokes the replayed session', async () => {
    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.test', password })
      .expect(200);
    const attempts = await Promise.all(
      [1, 2].map(() =>
        api()
          .post('/api/v1/auth/refresh')
          .set('Cookie', cookie(login))
          .set('X-RASID-Client', 'web'),
      ),
    );
    expect(attempts.map((response) => response.status).sort()).toEqual([
      200, 401,
    ]);
    const refreshed = body<AuthBody>(
      attempts.find((response) => response.status === 200)!,
    );
    await api()
      .get('/api/v1/auth/me')
      .set(auth(refreshed.accessToken))
      .expect(401);
  });
  it('logs out and revokes sessions immediately', async () => {
    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'alice@example.test', password })
      .expect(200);
    expect(cookieHeader(login)).toContain('HttpOnly');
    expect(cookieHeader(login)).toContain('SameSite=Strict');
    await api()
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie(login))
      .set('X-RASID-Client', 'web')
      .expect(204);
    await api()
      .get('/api/v1/auth/me')
      .set(auth(body<AuthBody>(login).accessToken))
      .expect(401);
    await api()
      .delete(`/api/v1/auth/sessions/${bob.sessionId}`)
      .set(auth(bob.accessToken))
      .expect(204);
    await api().get('/api/v1/auth/me').set(auth(bob.accessToken)).expect(401);
  });
  it('rate-limits repeated authentication attempts', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++)
      statuses.push(
        (
          await api()
            .post('/api/v1/auth/login')
            .send({ email: 'nobody@example.test', password })
        ).status,
      );
    expect(statuses).toContain(429);
  });
  it('can revert and reapply the initial migration in the isolated test database', async () => {
    await db.undoLastMigration();
    expect(await db.showMigrations()).toBe(true);
    await db.runMigrations();
    expect(await db.showMigrations()).toBe(false);
    expect(
      (
        await db.query<{ count: number }[]>(
          'SELECT count(*)::int AS count FROM categories',
        )
      )[0].count,
    ).toBe(8);
  });
});
