import assert from 'node:assert/strict';

// Mutating integration check against the local synthetic demo only. Every created
// management record is removed in finally; no financial seed row is changed.
const base = process.env.RASID_API_URL ?? 'http://localhost:3000/api/v1';
const email = process.env.DEMO_EMAIL ?? 'atif@example.test';
const password = process.env.DEMO_PASSWORD ?? 'Synthetic-Demo-Only-2026!';
const suffix = String(Date.now());
let accessToken;
let cookie;
let secondAccessToken;
let secondCookie;
let categoryId;
let budgetId;
let obligationId;

async function request(path, options = {}, token = accessToken) {
  return fetch(`${base}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

async function json(path, expectedStatus = 200, options = {}, token) {
  const response = await request(path, options, token);
  assert.equal(
    response.status,
    expectedStatus,
    `${options.method ?? 'GET'} ${path}: ${response.status}`,
  );
  return response.json();
}

async function login() {
  const response = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, 'demo login');
  return {
    cookie: response.headers.getSetCookie()[0].split(';')[0],
    body: await response.json(),
  };
}

try {
  const firstLogin = await login();
  cookie = firstLogin.cookie;
  accessToken = firstLogin.body.accessToken;
  const currentSessionId = firstLogin.body.sessionId;

  const secondLogin = await login();
  secondCookie = secondLogin.cookie;
  secondAccessToken = secondLogin.body.accessToken;
  const secondSessionId = secondLogin.body.sessionId;

  const sessions = await json('/auth/sessions');
  assert.ok(sessions.some((item) => item.id === currentSessionId));
  assert.ok(sessions.some((item) => item.id === secondSessionId));
  assert.equal(
    (
      await request(`/auth/sessions/${secondSessionId}`, {
        method: 'DELETE',
      })
    ).status,
    204,
  );
  assert.equal(
    (await request('/auth/me', {}, secondAccessToken)).status,
    401,
    'revoked session invalidates its access token',
  );
  const sessionsAfterRevoke = await json('/auth/sessions');
  assert.ok(
    sessionsAfterRevoke.find((item) => item.id === secondSessionId)?.revokedAt,
  );

  const category = await json('/categories', 201, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nameAr: `تصنيف اختباري ${suffix}`,
      nameEn: `Stage 7 category ${suffix}`,
    }),
  });
  categoryId = category.id;
  assert.ok(category.ownerUserId);

  const renamedCategory = await json(`/categories/${categoryId}`, 200, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nameEn: `Stage 7 renamed ${suffix}` }),
  });
  assert.equal(renamedCategory.nameAr, `تصنيف اختباري ${suffix}`);
  assert.equal(renamedCategory.nameEn, `Stage 7 renamed ${suffix}`);

  const budget = await json('/budgets', 201, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      categoryId,
      month: '2099-12',
      currency: 'SAR',
      limitAmount: '100.25',
    }),
  });
  budgetId = budget.id;
  assert.equal(budget.limitAmount, '100.25');
  const listedBudget = (
    await json('/budgets?month=2099-12&currency=SAR')
  ).data.find((item) => item.id === budgetId);
  assert.ok(listedBudget);
  assert.deepEqual(
    [
      listedBudget.spent,
      listedBudget.remaining,
      listedBudget.utilizationPercent,
      listedBudget.isExceeded,
    ],
    ['0.00', '100.25', 0, false],
  );
  const crossCurrencyConflict = await request('/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      categoryId,
      month: '2099-12',
      currency: 'USD',
      limitAmount: '50.00',
    }),
  });
  assert.equal(crossCurrencyConflict.status, 409);
  const editedBudget = await json(`/budgets/${budgetId}`, 200, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ limitAmount: '125.75' }),
  });
  assert.equal(editedBudget.limitAmount, '125.75');
  const listedEditedBudget = (
    await json('/budgets?month=2099-12&currency=SAR')
  ).data.find((item) => item.id === budgetId);
  assert.equal(listedEditedBudget?.remaining, '125.75');

  const obligation = await json('/obligations', 201, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Stage 7 estimate ${suffix}`,
      amount: '345.67',
      currency: 'SAR',
      dueDay: 28,
      categoryId,
      isActive: false,
    }),
  });
  obligationId = obligation.id;
  assert.equal(obligation.isActive, false);
  const editedObligation = await json(`/obligations/${obligationId}`, 200, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `Stage 7 updated ${suffix}` }),
  });
  assert.deepEqual(
    [
      editedObligation.amount,
      editedObligation.dueDay,
      editedObligation.isActive,
    ],
    ['345.67', 28, false],
  );

  assert.equal(
    (await request(`/categories/${categoryId}`, { method: 'DELETE' })).status,
    409,
    'referenced private category deletion is blocked',
  );

  const seededBudgets = await json('/budgets?month=2026-09&currency=SAR');
  const food = seededBudgets.data.find((item) => item.nameEn === 'Food');
  assert.ok(food);
  assert.deepEqual(
    [food.limitAmount, food.spent, food.remaining, food.isExceeded],
    ['700.00', '748.00', '-48.00', true],
  );

  assert.equal(
    (await request(`/budgets/${budgetId}`, { method: 'DELETE' })).status,
    204,
  );
  budgetId = undefined;
  assert.equal(
    (await request(`/obligations/${obligationId}`, { method: 'DELETE' }))
      .status,
    204,
  );
  obligationId = undefined;
  assert.equal(
    (await request(`/categories/${categoryId}`, { method: 'DELETE' })).status,
    204,
  );
  categoryId = undefined;

  console.log(
    JSON.stringify(
      {
        status: 'passed',
        checks: [
          'current and other session listing',
          'other-session revocation and immediate 401',
          'private category create and partial rename',
          'budget create, API facts, conflict, partial edit, and delete',
          'inactive obligation create, omitted-field preservation, and delete',
          'referenced category deletion conflict',
          'seeded budget overspend and negative remaining',
          'cleanup of every created management record',
        ],
      },
      null,
      2,
    ),
  );
} finally {
  if (accessToken && budgetId)
    await request(`/budgets/${budgetId}`, { method: 'DELETE' });
  if (accessToken && obligationId)
    await request(`/obligations/${obligationId}`, { method: 'DELETE' });
  if (accessToken && categoryId)
    await request(`/categories/${categoryId}`, { method: 'DELETE' });
  if (cookie) {
    const logout = await fetch(`${base}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie, 'X-RASID-Client': 'web' },
    });
    assert.equal(logout.status, 204, 'demo logout');
  }
  if (secondCookie) {
    await fetch(`${base}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: secondCookie, 'X-RASID-Client': 'web' },
    });
  }
}
