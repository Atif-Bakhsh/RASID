import { afterEach, describe, expect, it, vi } from 'vitest';

import { getApiProxyOrigin, getDemoCredentials } from './env';

afterEach(() => vi.unstubAllEnvs());

describe('optional public demo credentials', () => {
  it('hides the helper when neither value is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_EMAIL', '');
    vi.stubEnv('NEXT_PUBLIC_DEMO_PASSWORD', '');
    expect(getDemoCredentials()).toBeNull();
  });

  it('accepts a deliberately public synthetic pair', () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_EMAIL', 'demo@example.test');
    vi.stubEnv('NEXT_PUBLIC_DEMO_PASSWORD', 'Synthetic-Public-Only!');
    expect(getDemoCredentials()).toEqual({
      email: 'demo@example.test',
      password: 'Synthetic-Public-Only!',
    });
  });

  it('rejects partial configuration', () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_EMAIL', 'demo@example.test');
    vi.stubEnv('NEXT_PUBLIC_DEMO_PASSWORD', '');
    expect(() => getDemoCredentials()).toThrow(/must be set together/);
  });
});

describe('optional server-side API proxy origin', () => {
  it('is absent unless explicitly configured', () => {
    vi.stubEnv('RASID_API_PROXY_ORIGIN', '');
    expect(getApiProxyOrigin()).toBeNull();
  });

  it('accepts an origin without exposing an API path', () => {
    vi.stubEnv(
      'RASID_API_PROXY_ORIGIN',
      'https://rasid-api-production.example.up.railway.app/',
    );
    expect(getApiProxyOrigin()).toBe(
      'https://rasid-api-production.example.up.railway.app',
    );
  });

  it('rejects credentials and paths', () => {
    vi.stubEnv('RASID_API_PROXY_ORIGIN', 'https://api.example.test/api/v1');
    expect(() => getApiProxyOrigin()).toThrow(/origin only/);
  });
});
