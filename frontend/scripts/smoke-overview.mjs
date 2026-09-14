import assert from 'node:assert/strict';

// Read-only financial checks against the untouched synthetic demo seed.
// Authentication creates then revokes one session; tokens never leave memory.
const base = process.env.RASID_API_URL ?? 'http://localhost:3000/api/v1';
let cookie;
try {
  const login = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.DEMO_EMAIL ?? 'atif@example.test',
      password: process.env.DEMO_PASSWORD ?? 'Synthetic-Demo-Only-2026!',
    }),
  });
  assert.equal(login.status, 200, 'demo login');
  cookie = login.headers.getSetCookie()[0].split(';')[0];
  const { accessToken } = await login.json();
  async function get(path) {
    const response = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.equal(response.status, 200, path);
    return response.json();
  }
  const [monthly, budgets, insights, usd, empty] = await Promise.all([
    get('/analytics/monthly?month=2026-09&currency=SAR'),
    get('/budgets?month=2026-09&currency=SAR'),
    get('/insights?month=2026-09&currency=SAR'),
    get('/analytics/monthly?month=2026-09&currency=USD'),
    get('/analytics/monthly?month=2026-07&currency=SAR'),
  ]);
  assert.deepEqual(
    [monthly.income, monthly.spending, monthly.net, monthly.transactionCount],
    ['12300.00', '4653.00', '7647.00', 13],
  );
  const food = budgets.data.find((item) => item.nameEn === 'Food');
  assert.ok(food, 'food budget exists');
  assert.deepEqual(
    [food.limitAmount, food.spent, food.remaining, food.isExceeded],
    ['700.00', '748.00', '-48.00', true],
  );
  assert.equal(
    monthly.obligations.interpretation,
    'RECURRING_ESTIMATE_NOT_ADDITIONAL_SPENDING',
  );
  assert.ok(insights.disclaimerAr && insights.disclaimerEn);
  assert.ok(
    insights.data.some(
      (item) =>
        item.rule === 'BUDGET_EXCEEDED' &&
        item.version &&
        item.facts.spent === '748.00',
    ),
  );
  for (const noData of [usd, empty]) {
    assert.deepEqual(
      [noData.income, noData.spending, noData.net, noData.transactionCount],
      ['0.00', '0.00', '0.00', 0],
    );
    assert.equal(noData.comparison.spendingChangePercent, null);
  }
  console.log(
    JSON.stringify(
      {
        status: 'passed',
        monthly,
        budgets,
        insights,
        emptyScopes: ['2026-09/USD', '2026-07/SAR'],
      },
      null,
      2,
    ),
  );
} finally {
  if (cookie) {
    const logout = await fetch(`${base}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie, 'X-RASID-Client': 'web' },
    });
    assert.equal(logout.status, 204, 'demo logout');
  }
}
