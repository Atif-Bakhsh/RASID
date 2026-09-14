import { beforeEach, describe, expect, it, vi } from 'vitest';

import { login, logout, refresh, register } from './api';

const session = {
  accessToken: 'memory-only-access-token',
  expiresIn: 900,
  sessionId: '62aef265-9cce-41d8-a33d-eedd81ef0a1a',
  tokenType: 'Bearer',
  user: {
    createdAt: '2026-09-12T10:00:00.000Z',
    dataMode: 'DEMO_ONLY',
    email: 'atif@example.test',
    id: 'f72afe0a-c153-49b4-b675-c4d6d8ce6c23',
    locale: 'ar',
    timezone: 'Asia/Riyadh',
  },
};

describe('authentication API transport', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3000/api/v1';
    vi.unstubAllGlobals();
  });

  it('uses credentialed cookie requests and the CSRF header where required', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(session))
      .mockResolvedValueOnce(Response.json(session, { status: 201 }))
      .mockResolvedValueOnce(Response.json(session))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await login({ email: 'atif@example.test', password: 'demo-password-2026' });
    await register({
      email: 'new@example.test',
      password: 'demo-password-2026',
    });
    await refresh();
    await logout();

    const [loginUrl, loginInit] = fetchMock.mock.calls[0];
    const [registerUrl, registerInit] = fetchMock.mock.calls[1];
    const [refreshUrl, refreshInit] = fetchMock.mock.calls[2];
    const [logoutUrl, logoutInit] = fetchMock.mock.calls[3];

    expect(loginUrl).toBe('http://localhost:3000/api/v1/auth/login');
    expect(registerUrl).toBe('http://localhost:3000/api/v1/auth/register');
    expect(refreshUrl).toBe('http://localhost:3000/api/v1/auth/refresh');
    expect(logoutUrl).toBe('http://localhost:3000/api/v1/auth/logout');
    for (const init of [loginInit, registerInit, refreshInit, logoutInit]) {
      expect(init.credentials).toBe('include');
    }
    expect(new Headers(refreshInit.headers).get('X-RASID-Client')).toBe('web');
    expect(new Headers(logoutInit.headers).get('X-RASID-Client')).toBe('web');
    expect(JSON.parse(String(loginInit.body))).toEqual({
      email: 'atif@example.test',
      password: 'demo-password-2026',
    });
  });
});
