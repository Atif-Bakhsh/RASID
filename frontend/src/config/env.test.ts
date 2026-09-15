import { afterEach, describe, expect, it, vi } from 'vitest';

import { getDemoCredentials } from './env';

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
