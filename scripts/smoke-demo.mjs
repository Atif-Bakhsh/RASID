import assert from 'node:assert/strict';
import { config } from 'dotenv';
config({ quiet: true });

const base = process.env.RASID_API_URL ?? 'http://localhost:3000';
const month = process.env.DEMO_MONTH ?? '2026-09';
let refreshCookie;
async function json(path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  assert.equal(response.status, 200, `${options.method ?? 'GET'} ${path}: ${response.status}`);
  return response;
}
try {
  assert.equal((await (await json('/api/v1/health/ready')).json()).status, 'ready');
  const docs = await json('/docs'); assert.match(await docs.text(), /Swagger UI/);
  const contract = await (await json('/openapi.json')).json();
  assert.ok(contract.paths['/api/v1/transactions']);
  assert.ok(contract.components.schemas.MonthlyAnalytics);
  const login = await json('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD }) });
  refreshCookie = login.headers.getSetCookie()[0].split(';')[0];
  assert.match(login.headers.getSetCookie()[0], /HttpOnly/);
  const { accessToken } = await login.json();
  const headers = { Authorization: `Bearer ${accessToken}`, 'X-Request-ID': 'rasid-smoke-demo' };
  const response = await json(`/api/v1/analytics/monthly?month=${month}&currency=SAR`, { headers });
  assert.equal(response.headers.get('x-request-id'), 'rasid-smoke-demo');
  const facts = await response.json();
  assert.deepEqual([facts.income, facts.spending, facts.net], ['12300.00', '4653.00', '7647.00']);
  const budgets = await (await json(`/api/v1/budgets?month=${month}&currency=SAR`, { headers })).json();
  assert.equal(budgets.data[0].remaining, '-48.00');
  const blocked = await fetch(`${base}/api/v1/auth/login`, { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(blocked.status, 403);
  console.log(JSON.stringify({ status: 'passed', month, checks: ['readiness','Swagger','OpenAPI response schemas','cookie auth','request ID','synthetic reconciliation','budget remaining','origin rejection'], totals: { income: facts.income, spending: facts.spending, net: facts.net } }, null, 2));
} finally {
  if (refreshCookie) {
    const logout = await fetch(`${base}/api/v1/auth/logout`, { method: 'POST', headers: { Cookie: refreshCookie, 'X-RASID-Client': 'web' } });
    assert.equal(logout.status, 204);
  }
}
