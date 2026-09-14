import assert from 'node:assert/strict';

// Mutating integration check against the local synthetic demo only. Every created
// record is removed in finally, and the untouched September totals are rechecked.
const base = process.env.RASID_API_URL ?? 'http://localhost:3000/api/v1';
const suffix = String(Date.now());
let accessToken;
let cookie;
let accountId;
let transactionId;

async function request(path, options = {}) {
  return fetch(`${base}${path}`, {
    ...options,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
}

async function json(path, expectedStatus = 200, options = {}) {
  const response = await request(path, options);
  assert.equal(
    response.status,
    expectedStatus,
    `${options.method ?? 'GET'} ${path}: ${response.status}`,
  );
  return response.json();
}

try {
  const login = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.DEMO_EMAIL ?? 'atif@example.test',
      password: process.env.DEMO_PASSWORD ?? 'Synthetic-Demo-Only-2026!',
    }),
  });
  assert.equal(login.status, 200, 'demo login');
  cookie = login.headers.getSetCookie()[0].split(';')[0];
  ({ accessToken } = await login.json());

  const firstAccountPage = await json('/accounts?page=1&limit=1');
  assert.equal(firstAccountPage.meta.limit, 1);
  assert.equal(firstAccountPage.meta.total, 3);
  assert.equal(firstAccountPage.meta.totalPages, 3);
  const untouchedTransactions = await json('/transactions?page=1&limit=1');
  assert.equal(untouchedTransactions.meta.total, 14);

  const account = await json('/accounts', 201, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Stage 3 synthetic ${suffix}`,
      type: 'CASH',
      currency: 'SAR',
      balance: '-25.10',
      balanceAsOf: '2026-09-13T09:00:00+03:00',
    }),
  });
  accountId = account.id;
  assert.equal(account.balance, '-25.10');

  const accountDetail = await json(`/accounts/${accountId}`);
  assert.equal(accountDetail.id, accountId);
  const renamedAccount = await json(`/accounts/${accountId}`, 200, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `Stage 3 verified ${suffix}` }),
  });
  assert.equal(renamedAccount.balance, '-25.10');
  assert.equal(renamedAccount.type, 'CASH');
  assert.equal(renamedAccount.currency, 'SAR');

  const categories = await json('/categories');
  assert.ok(categories.length > 0);
  const categoryId = categories[0].id;
  const transactionInput = {
    accountId,
    postedAt: '2026-09-13',
    amount: '12.34',
    direction: 'EXPENSE',
    merchant: `Stage 3 merchant ${suffix}`,
    categoryId,
    reference: `stage3-${suffix}`,
  };
  const transaction = await json('/transactions', 201, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transactionInput),
  });
  transactionId = transaction.id;
  assert.equal(transaction.postedAt, '2026-09-13');
  assert.equal(transaction.amount, '12.34');
  assert.equal(transaction.source, 'MANUAL');

  const duplicate = await request('/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transactionInput),
  });
  assert.equal(duplicate.status, 409);
  assert.equal((await duplicate.json()).error.code, 'DUPLICATE_TRANSACTION');

  const clearedCategory = await json(`/transactions/${transactionId}`, 200, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId: null }),
  });
  assert.equal(clearedCategory.categoryId, null);
  const renamedTransaction = await json(`/transactions/${transactionId}`, 200, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant: `Stage 3 updated ${suffix}` }),
  });
  assert.equal(renamedTransaction.amount, '12.34');
  assert.equal(renamedTransaction.postedAt, '2026-09-13');
  assert.equal(renamedTransaction.categoryId, null);

  const query = new URLSearchParams({
    page: '1',
    limit: '1',
    accountId,
    direction: 'EXPENSE',
    currency: 'SAR',
    from: '2026-09-13',
    to: '2026-09-13',
    search: `updated ${suffix}`,
    orderBy: 'amount',
    order: 'ASC',
  });
  const filtered = await json(`/transactions?${query}`);
  assert.equal(filtered.meta.total, 1);
  assert.equal(filtered.data[0].id, transactionId);
  assert.equal(filtered.data[0].postedAt, '2026-09-13');

  const blockedDelete = await request(`/accounts/${accountId}`, {
    method: 'DELETE',
  });
  assert.equal(blockedDelete.status, 409);

  assert.equal(
    (await request(`/transactions/${transactionId}`, { method: 'DELETE' }))
      .status,
    204,
  );
  transactionId = undefined;
  assert.equal(
    (await request(`/accounts/${accountId}`, { method: 'DELETE' })).status,
    204,
  );
  accountId = undefined;

  const monthly = await json('/analytics/monthly?month=2026-09&currency=SAR');
  assert.deepEqual(
    [monthly.income, monthly.spending, monthly.net, monthly.transactionCount],
    ['12300.00', '4653.00', '7647.00', 13],
  );

  console.log(
    JSON.stringify(
      {
        status: 'passed',
        checks: [
          'account pagination/detail/create/allowed patch/delete',
          'account deletion conflict',
          'transaction create/filter/order/patch/delete',
          'date-only and exact decimal strings',
          'explicit null category clearing and omitted-field preservation',
          'duplicate transaction conflict',
          'September reconciliation after cleanup',
        ],
      },
      null,
      2,
    ),
  );
} finally {
  if (accessToken && transactionId) {
    await request(`/transactions/${transactionId}`, { method: 'DELETE' });
  }
  if (accessToken && accountId) {
    await request(`/accounts/${accountId}`, { method: 'DELETE' });
  }
  if (cookie) {
    const logout = await fetch(`${base}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie, 'X-RASID-Client': 'web' },
    });
    assert.equal(logout.status, 204, 'demo logout');
  }
}
