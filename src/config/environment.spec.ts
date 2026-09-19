import { validateEnvironment } from './environment';
const valid = {
  DATABASE_URL: 'postgresql://rasid:local@localhost/rasid_test',
  JWT_SECRET: 'a'.repeat(48),
};
describe('Environment contract', () => {
  it('sets typed defaults', () => {
    expect(validateEnvironment(valid)).toMatchObject({
      PORT: 3000,
      COOKIE_SECURE: false,
      TRUST_PROXY_HOPS: 0,
      AI_ENABLED: false,
      OPENAI_MODEL: 'gpt-5.6-luna',
      AI_TIMEOUT_MS: 10000,
    });
  });
  it.each([
    { JWT_SECRET: 'short' },
    { DATABASE_URL: 'sqlite:///tmp/a' },
    { PORT: 0 },
    { COOKIE_SECURE: '1' },
    { CORS_ORIGINS: '*' },
    { TRUST_PROXY_HOPS: 'true' },
    { AI_ENABLED: 'yes' },
    { AI_ENABLED: 'true' },
    { OPENAI_MODEL: 'gpt-4o-mini' },
    { AI_TIMEOUT_MS: 999 },
    {
      NODE_ENV: 'production',
      COOKIE_SECURE: 'false',
      CORS_ORIGINS: 'https://demo.example.com',
    },
    { NODE_ENV: 'production', CORS_ORIGINS: 'http://example.com' },
  ])('rejects invalid configuration %j', (override) => {
    expect(() => validateEnvironment({ ...valid, ...override })).toThrow();
  });

  it('accepts the opt-in AI configuration', () => {
    expect(
      validateEnvironment({
        ...valid,
        AI_ENABLED: 'true',
        OPENAI_API_KEY: 'test-key',
        OPENAI_MODEL: 'gpt-5.6-terra',
        AI_TIMEOUT_MS: '5000',
      }),
    ).toMatchObject({
      AI_ENABLED: true,
      OPENAI_MODEL: 'gpt-5.6-terra',
      AI_TIMEOUT_MS: 5000,
    });
  });
});
